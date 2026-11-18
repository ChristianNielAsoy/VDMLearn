import type { Scheduler } from '@/types/scheduler';
import { sm2Scheduler } from './sm2';
import { fsrsScheduler } from './fsrs';

export function getActiveScheduler(): Scheduler {
  const flag = typeof localStorage !== 'undefined' ? localStorage.getItem('dvmr-scheduler') : null;
  return flag === 'fsrs' ? fsrsScheduler : sm2Scheduler;
}

export { sm2Scheduler, fsrsScheduler };
