// frontend-web/src/types/tutor.types.ts

export type AvatarPoseType = 'idle' | 'explaining' | 'listening' | 'celebrating' | 'encouraging';

export type VisemeShape = 'sil' | 'aa' | 'E' | 'ih' | 'oh' | 'ou';

export interface VisemeFrame {
  timeMs: number;
  shape: VisemeShape;
  weight: number;
}

export interface CollectedLessonSummary {
  id: string;
  order: number;
  title: string;
  contextSummary: string;
}

export interface ModuleEvaluationContext {
  moduleId: string;
  moduleTitle: string;
  courseTitle: string;
  totalLessons: number;
  lessons: Array<{
    id: string;
    order: number;
    title: string;
    contextText: string;
  }>;
}

export interface EvaluationTurnState {
  currentLessonIndex: number;
  totalLessons: number;
  lessonTitle: string;
  questionText: string;
  feedbackText?: string;
  isLastLesson: boolean;
}

export interface FinalEvaluationSummary {
  approved: boolean;
  scorePercentage: number;
  correctAnswersCount?: number;
  totalQuestions?: number;
  closingRemarks: string;
  attemptId?: string;
  isSimulation?: boolean;
}

export interface TestConnectionResponse {
  success: boolean;
  provider: string;
  modelUsed: string;
  phrase: string;
  timestamp: string;
  visemes: VisemeFrame[];
}

export interface StartModuleEvaluationResponse {
  moduleId: string;
  moduleTitle: string;
  totalLessons: number;
  currentLessonIndex: number;
  currentLessonTitle: string;
  questionText: string;
  visemes: VisemeFrame[];
  collectedContext: {
    lessons: CollectedLessonSummary[];
  };
}

export interface AnswerModuleEvaluationResponse {
  isCorrect: boolean;
  feedbackText: string;
  visemes: VisemeFrame[];
  avatarEmotion: AvatarPoseType;
  hasNextLesson: boolean;
  isSimulation?: boolean;
  nextQuestion?: {
    lessonIndex: number;
    lessonTitle: string;
    questionText: string;
  };
  finalSummary?: FinalEvaluationSummary;
}
