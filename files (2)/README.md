# content/ : how VDMLearn content is organized

Git is the master copy of everything authored here. A publish script (see docs/supabase-plan.md) copies approved content into Supabase for the online app. Nothing in the app's code should hold content.

```
content/
├── README.md
├── .gitignore                    raw sources and private notes stay out of Git
├── _schema/                      JSON Schemas that every file must pass
│   ├── question.schema.json
│   ├── source.schema.json
│   ├── media.schema.json
│   └── pack-manifest.schema.json
├── sources/
│   ├── sources.json              registry: license, aiIngestion, shareable
│   ├── raw/                      downloaded articles (gitignored, never published)
│   └── notes/                    your own notes typed from books (private/ is gitignored)
├── taxonomy/
│   ├── year0-taxonomy.json       Pre-DVM topics (draft; approve before use)
│   └── README.md                 PRC topics live in src/data/vmle-tos-2024.json (do not duplicate)
├── library/                      the authored content, by track then subject
│   ├── vmle/                     one folder per PRC exam subject
│   │   ├── anatomy/ physiology/ zootechnics/ pathology/ pharmacology/
│   │   ├── medicine/ microbiology-public-health/ parasitology/ surgery/
│   │   └── <subject>/{lessons,questions,diagrams}/
│   └── pre-dvm/                  one folder per Year 0 area
│       ├── general-biology/ general-chemistry/ organic-chemistry/
│       ├── biochemistry/ statistics/ animal-science/
│       └── <area>/{lessons,questions,diagrams}/
├── media/
│   └── media.json                every image/diagram with license + attribution
└── packs/
    ├── pack-001/manifest.json    release unit: file list + SHA-256 checksums
    └── dist/                     built bundles (gitignored)
```

## Conventions

| Thing            | Rule                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lesson file      | `library/<track>/<subject>/lessons/lesson-<code>-<nnn>.md`, with the front matter used in pack 001                                                     |
| Question file    | one array per subject: `library/<track>/<subject>/questions/<subject>.questions.json`                                                                  |
| Question id      | `<code>-<nnn>` lowercase (e.g. `rum-001`); unique across the whole library                                                                             |
| Competency id    | PRC: `Veterinary Pharmacology:A.3` (must exist in src/data/vmle-tos-2024.json). Year 0: `PRE:GENCHEM:E.1` (must exist in taxonomy/year0-taxonomy.json) |
| Diagrams         | live next to the lesson that uses them, in the same subject's `diagrams/`; lessons link with `../diagrams/<file>`                                      |
| Hotspot file     | `<diagram>.hotspots.json` next to the SVG, with `svg` set to the SVG's file name                                                                       |
| Sources          | every question and lesson cites a `sourceId` that exists in `sources/sources.json` plus a locator                                                      |
| Status           | everything starts `unverified`; becomes `verified` only after 2 approvals by different people on the exact current text                                |
| Media            | register every image in `media/media.json`; own drawings are CC0                                                                                       |
| Private material | goes in `sources/raw/` or `sources/notes/private/` (gitignored). Items from a source with `shareable: false` are never published                       |

## Adding content (the loop)

1. Register the source in `sources/sources.json` (check its license and AI-use terms first).
2. Write the lesson or questions in the right `library/` folder, using a competency id.
3. Validate against `_schema/` (the publish script does this; run it before committing).
4. Add the files to a pack manifest (checksums included) when you want to release them.
5. Verify later, against the real source, by reading it yourself.

## What is in pack-001

7 lessons, 4 diagrams, 55 questions (41 PRC-tagged, 14 Year 0). All are unverified author drafts. Year 0 questions need the app to support `PRE:` ids (milestone V3).

## Checks run on this tree

All 55 questions pass `_schema/question.schema.json`; sources, media and manifest pass their schemas; every manifest checksum matches; every hotspot and lesson diagram reference resolves. Facts have NOT been checked against references.
