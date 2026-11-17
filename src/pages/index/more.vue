<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">More</div>

    <q-list separator bordered class="dvmr-card">
      <q-item clickable v-ripple to="/notes">
        <q-item-section avatar>
          <q-icon name="edit_note" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>My Notes</q-item-label>
          <q-item-label caption>Competency notes, cloze cards, blurt mode</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/planner">
        <q-item-section avatar>
          <q-icon name="calendar_month" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Study Planner</q-item-label>
          <q-item-label caption>Tasks and exam countdown</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/">
        <q-item-section avatar>
          <q-icon name="explore" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Browse Questions</q-item-label>
          <q-item-label caption>By exam topic or course</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/mock">
        <q-item-section avatar>
          <q-icon name="timer" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Mock Board Exam</q-item-label>
          <q-item-label caption>Timed VMLE-weighted exam</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/calculators">
        <q-item-section avatar>
          <q-icon name="calculate" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Calculators</q-item-label>
          <q-item-label caption>Drug dose, fluid therapy, Pearson square, epidemiology</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/checklists">
        <q-item-section avatar>
          <q-icon name="checklist" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Skills Checklists</q-item-label>
          <q-item-label caption>Necropsy, physical exam, injections, sutures</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/reference">
        <q-item-section avatar>
          <q-icon name="auto_stories" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Quick Reference</q-item-label>
          <q-item-label caption>Normal values, gestation, cycles + Pre-DVM skill tree</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/cases">
        <q-item-section avatar>
          <q-icon name="medical_services" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Virtual Patient Cases</q-item-label>
          <q-item-label caption>Step-through clinical scenarios with branching decisions</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/interop">
        <q-item-section avatar>
          <q-icon name="swap_horiz" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Export &amp; Interop</q-item-label>
          <q-item-label caption>Anki CSV, Markdown notes, content pack sharing</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/import">
        <q-item-section avatar>
          <q-icon name="upload" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Import Questions</q-item-label>
          <q-item-label caption>Add AI-generated question sets</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>

      <q-item clickable v-ripple to="/settings">
        <q-item-section avatar>
          <q-icon name="settings" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Settings</q-item-label>
          <q-item-label caption>Dark mode, backup, preferences</q-item-label>
        </q-item-section>
        <q-item-section side><q-icon name="chevron_right" /></q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>
