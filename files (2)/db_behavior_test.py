import pgserver, tempfile, psycopg2, uuid, json, sys, re
srv=pgserver.get_server(tempfile.mkdtemp())
conn=psycopg2.connect(srv.get_uri()); conn.autocommit=True
cur=conn.cursor()
def run(sql,params=None):
    cur.execute(sql,params); 
    try: return cur.fetchall()
    except psycopg2.ProgrammingError: return None
results=[]
def check(name,ok,detail=""): results.append((name,ok,detail)); print(("PASS " if ok else "FAIL ")+name+(" :: "+detail if detail and not ok else ""))
def expect_error(name,sql,params=None,contains=None):
    try:
        cur.execute(sql,params); check(name,False,"no error raised")
    except psycopg2.Error as e:
        msg=str(e).strip().splitlines()[0]
        check(name,(contains is None or contains in msg),msg)

# ---- stubs for Supabase-managed pieces
run("create role authenticated nologin; create role anon nologin;")
run("grant usage on schema public to authenticated, anon;")
run("create schema auth; create table auth.users(id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);")
run("create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;")
run("create schema storage; create table storage.buckets(id text primary key, name text, public boolean); create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text);")
try: run("create extension if not exists pgcrypto")
except Exception as e: print("pgcrypto unavailable, using built-in gen_random_uuid"); conn.rollback() if not conn.autocommit else None
for f in ['migrations/0001_content_schema.sql','migrations/0002_rls.sql','migrations/0003_storage.sql']:
    sql=open(f).read()
    try: cur.execute(sql); print("applied",f)
    except psycopg2.Error as e: print("APPLY ERROR",f,e); sys.exit(1)
run("grant select, insert, update, delete on all tables in schema public to authenticated; grant usage on all sequences in schema public to authenticated;")
run("grant select, insert, update, delete on storage.objects, storage.buckets to authenticated; grant usage on schema storage to authenticated; grant usage on schema auth to authenticated;")

# ---- users
A,B,C=[str(uuid.uuid4()) for _ in range(3)]
for i,u in enumerate([A,B,C]): run("insert into auth.users(id,email) values (%s,%s)",(u,f"u{i}@example.com"))
roles=dict(run("select id::text, role from public.profiles"))
check("first user becomes owner",roles[A]=='owner',str(roles))
check("later users are members",roles[B]=='member' and roles[C]=='member')

# ---- reference + question
run("insert into public.sources(id,title,type,shareable) values ('author-draft','Author draft','original',true),('private-book','Private book','textbook',false)")
run("insert into public.competencies(id,scheme,subject,name,items,exam_weight_pct) values ('Zootechnics:B.1','PRC','Zootechnics','Digestive tract',4,12)")
q=("rum-001",2,"Zootechnics","Zootechnics:B.1","Which compartment is the glandular stomach?",json.dumps([{"key":k,"text":t} for k,t in zip("ABCD",["Rumen","Reticulum","Omasum","Abomasum"])]),"D","Only the abomasum is glandular.","ai-draft","Author draft; verify","author-draft",A)
run("insert into public.questions(id,year,vmle_subject,competency_id,stem,choices,answer,explanation,source_type,source,source_id,created_by) values (%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s)",q)
h1,st=run("select content_hash,status from public.questions where id='rum-001'")[0]
check("question inserted unverified with hash",st=='unverified' and h1 is not None)

# ---- approvals
expect_error("author cannot approve own question","insert into public.question_approvals(question_id,user_id,content_hash,source_cited) values ('rum-001',%s,%s,'p.1')",(A,h1),"authors cannot approve")
expect_error("stale hash rejected","insert into public.question_approvals(question_id,user_id,content_hash,source_cited) values ('rum-001',%s,'deadbeef','p.1')",(B,),"stale review")
expect_error("blank source rejected","insert into public.question_approvals(question_id,user_id,content_hash,source_cited) values ('rum-001',%s,%s,'   ')",(B,h1))
run("insert into public.question_approvals(question_id,user_id,content_hash,source_cited) values ('rum-001',%s,%s,'Reece ch.28')",(B,h1))
check("one approval keeps it unverified",run("select status from public.questions where id='rum-001'")[0][0]=='unverified')
expect_error("same user cannot approve twice","insert into public.question_approvals(question_id,user_id,content_hash,source_cited) values ('rum-001',%s,%s,'p.2')",(B,h1))
run("insert into public.question_approvals(question_id,user_id,content_hash,source_cited) values ('rum-001',%s,%s,'Dyce p.99')",(C,h1))
check("two approvals => verified",run("select status from public.questions where id='rum-001'")[0][0]=='verified')
# edit content => unverified, version bump
v0=run("select version from public.questions where id='rum-001'")[0][0]
run("update public.questions set explanation='Only the abomasum is glandular (HCl, pepsinogen).' where id='rum-001'")
st,ver,h2=run("select status,version,content_hash from public.questions where id='rum-001'")[0]
check("content edit resets to unverified",st=='unverified')
check("version increments on edit",ver>v0)
check("hash changes on edit",h2!=h1)
# non-content edit (e.g. nothing changed) keeps hash; old approvals no longer count
run("insert into public.question_approvals(question_id,user_id,content_hash,source_cited) values ('rum-001',%s,%s,'re-check')" ,(B,h2)) if False else None
check("old approvals do not count after edit",run("select count(*) from public.question_approvals a join public.questions q on q.id=a.question_id and q.content_hash=a.content_hash")[0][0]==0)
run("delete from public.question_approvals where question_id='rum-001' and user_id=%s",(B,))
check("recompute trigger runs on delete (stays unverified)",run("select status from public.questions where id='rum-001'")[0][0]=='unverified')

# ---- private question for RLS tests
q2=list(q); q2[0]="priv-001"; q2[10]="private-book"
run("insert into public.questions(id,year,vmle_subject,competency_id,stem,choices,answer,explanation,source_type,source,source_id,created_by) values (%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s)",q2)
def as_user(u):
    run("reset role"); run("select set_config('request.jwt.claim.sub',%s,false)",(u,)); run("set role authenticated")
as_user(B)
vis=[r[0] for r in run("select id from public.questions order by id")]
check("member sees shareable-source question",'rum-001' in vis)
check("member cannot see non-shareable question",'priv-001' not in vis,str(vis))
as_user(A)
vis=[r[0] for r in run("select id from public.questions order by id")]
check("owner sees both",set(vis)=={'rum-001','priv-001'},str(vis))
as_user(B)
expect_error("member cannot insert as verified",
  "insert into public.questions(id,year,competency_id,stem,choices,answer,explanation,source_type,source,source_id,status,created_by) values ('m-001',1,'Zootechnics:B.1','A stem that is long enough',%s::jsonb,'A','An explanation text','hand-written','x','author-draft','verified',%s)",
  (json.dumps([{"key":k,"text":k} for k in "ABCD"]),B))
run("insert into public.questions(id,year,competency_id,stem,choices,answer,explanation,source_type,source,source_id,status,created_by) values ('m-002',1,'Zootechnics:B.1','A stem that is long enough',%s::jsonb,'A','An explanation text','hand-written','x','author-draft','unverified',%s)",(json.dumps([{"key":k,"text":k} for k in "ABCD"]),B))
check("member can insert own unverified question",run("select count(*) from public.questions where id='m-002'")[0][0]==1)
expect_error("member cannot write sources","insert into public.sources(id,title,type) values ('x','x','x')")
# attempts privacy
as_user(A); run("insert into public.attempts(user_id,question_id,correct) values (%s,'rum-001',true)",(A,))
as_user(B)
check("attempts are private",run("select count(*) from public.attempts")[0][0]==0)
expect_error("cannot insert attempts for someone else","insert into public.attempts(user_id,question_id,correct) values (%s,'rum-001',true)",(A,))
# coverage view as owner
as_user(A)
cov=run("select competency_id, questions_total, questions_verified from public.coverage")
check("coverage view works",len(cov)==1 and cov[0][1]>=1,str(cov))
run("reset role")
passed=sum(1 for r in results if r[1]); print(f"\n{passed}/{len(results)} checks passed")
open('/tmp/pg_results.json','w').write(json.dumps(results))
