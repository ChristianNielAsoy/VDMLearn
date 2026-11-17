export type TaskType = 'homework' | 'lab' | 'report' | 'exam' | 'requirement';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface SchoolTask {
  id: string;
  title: string;
  subject: string;
  type: TaskType;
  dueAt: number;
  status: TaskStatus;
  notes?: string;
  topicId?: string;
  createdAt: number;
}

export interface PlannerSettings {
  id: 'singleton';
  examDate?: number;
  weeklyQuestionGoal: number;
  weeklyLessonGoal: number;
}
