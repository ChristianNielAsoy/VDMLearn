<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary">
      <q-toolbar style="min-height: 56px">
        <div class="dvmr-wordmark q-mr-sm" aria-hidden="true">VDM</div>
        <q-toolbar-title
          class="text-weight-semibold"
          style="font-size: 1rem; letter-spacing: -0.01em"
        >
          Learn
        </q-toolbar-title>

        <q-btn
          flat
          round
          dense
          icon="notifications_none"
          aria-label="Notifications"
          class="q-mr-xs"
          disable
          title="Notifications (coming soon)"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view #default="{ Component }">
        <transition name="dvmr-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- 6-tab bottom navigation -->
    <q-footer class="dvmr-footer">
      <q-tabs
        dense
        align="justify"
        active-color="primary"
        indicator-color="primary"
        :class="$q.dark.isActive ? 'bg-grey-10 text-grey-4' : 'bg-white text-grey-7'"
        style="min-height: var(--dvmr-nav-height)"
      >
        <q-route-tab icon="today" label="Today" to="/today" />
        <q-route-tab icon="menu_book" label="Learn" to="/lessons" />
        <q-route-tab icon="quiz" label="Practice" to="/quiz" :disable="!quizActive" />
        <q-route-tab icon="image" label="Visual" to="/visual" />
        <q-route-tab icon="bar_chart" label="Progress" to="/progress" />
        <q-route-tab icon="more_horiz" label="More" to="/more" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useQuizStore } from '@/stores/quizStore';

const $q = useQuasar();
const quizStore = useQuizStore();
const quizActive = computed(() => quizStore.queue.length > 0);

onMounted(() => {
  const saved = localStorage.getItem('dvmr-dark');
  if (saved === '1') $q.dark.set(true);
});
</script>

<style>
.dvmr-wordmark {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 3px 7px;
  border-radius: 5px;
  line-height: 1;
  flex-shrink: 0;
}

.dvmr-footer {
  border-top: 1px solid var(--dvmr-border);
}

.body--dark .dvmr-footer {
  border-top-color: var(--dvmr-border-dark);
}
</style>
