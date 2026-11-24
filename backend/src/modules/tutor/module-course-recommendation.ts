import type { CourseRecommendationDto } from './dto/module-evaluation.dto';

interface CatalogCourse {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
}

interface EvaluatedModule {
  title: string;
  course: { title: string; categoryId: string | null; category: { name: string } | null };
  lessons: { title: string }[];
}

const genericTerms = new Set([
  'aprende', 'avanzado', 'basico', 'como', 'conceptos', 'con', 'curso', 'del',
  'ejercicios', 'este', 'fundamentos', 'introduccion', 'las', 'leccion',
  'los', 'mas', 'modulo', 'nivel', 'para', 'parte', 'por', 'principios',
  'que', 'sobre', 'sus', 'tema', 'temas', 'una', 'uno',
]);

function topicTerms(text: string): Set<string> {
  const words = text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .match(/[a-z0-9]{3,}/g) ?? [];
  return new Set(words.filter(word => !genericTerms.has(word)));
}

function countMatches(terms: Set<string>, courseTerms: Set<string>): number {
  return [...terms].filter(term => courseTerms.has(term)).length;
}

export function rankCourseCandidates(module: EvaluatedModule, courses: CatalogCourse[]) {
  const moduleTerms = topicTerms(`${module.course.title} ${module.title}`);
  const lessonTerms = module.lessons.map(lesson => topicTerms(lesson.title));
  const categoryId = module.course.category?.name.trim().toLowerCase() === 'general'
    ? null
    : module.course.categoryId;

  return courses.map(course => {
    const courseTerms = topicTerms(`${course.title} ${course.description}`);
    const moduleMatches = countMatches(moduleTerms, courseTerms);
    const lessonMatches = lessonTerms.map(terms => countMatches(terms, courseTerms));
    const sameCategory = categoryId !== null && categoryId === course.categoryId;
    const affinity = moduleMatches + lessonMatches.reduce((sum, matches) => sum + matches, 0);
    return { course, sameCategory, lessonMatches, affinity };
  })
    .filter(candidate => candidate.affinity > 0 || candidate.sameCategory)
    .sort((a, b) => b.affinity - a.affinity ||
      Number(b.sameCategory) - Number(a.sameCategory) ||
      a.course.id.localeCompare(b.course.id));
}

export function chooseCourseRecommendation(
  module: EvaluatedModule,
  candidates: ReturnType<typeof rankCourseCandidates>,
  selectedCourseId: unknown,
  results: boolean[],
): CourseRecommendationDto | null {
  const missedLessons = results.flatMap((correct, index) => correct ? [] : [index]);
  const focus = missedLessons.length > 0 ? missedLessons : results.map((_, index) => index);
  const focusScore = (candidate: typeof candidates[number]) =>
    focus.reduce((sum, index) => sum + (candidate.lessonMatches[index] ?? 0), 0);
  const selected = candidates.find(({ course }) => course.id === selectedCourseId) ??
    [...candidates].sort((a, b) => focusScore(b) - focusScore(a))[0];
  if (!selected) return null;

  const focusIndex = focus.find(index => selected.lessonMatches[index] > 0);
  const reason = focusIndex === undefined
    ? `Está relacionado con lo que estudiaste en «${module.title}».`
    : missedLessons.length > 0
      ? `Te ayuda a reforzar «${module.lessons[focusIndex].title}».`
      : `Te ayuda a ampliar lo que aprendiste en «${module.lessons[focusIndex].title}».`;

  return { courseId: selected.course.id, courseTitle: selected.course.title, reason };
}
