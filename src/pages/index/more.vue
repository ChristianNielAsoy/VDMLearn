<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">More</div>

    <q-list separator bordered class="dvmr-card">
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
