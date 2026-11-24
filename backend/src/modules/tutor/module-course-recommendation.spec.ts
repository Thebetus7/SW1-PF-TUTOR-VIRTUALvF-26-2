import { chooseCourseRecommendation, rankCourseCandidates } from './module-course-recommendation';

describe('Module course recommendation', () => {
  const evaluatedModule = {
    title: 'Matemáticas',
    course: { title: 'Matemáticas para secundaria', categoryId: 'math', category: { name: 'Matemáticas' } },
    lessons: [{ title: 'Geometría' }, { title: 'Fracciones' }],
  };
  const courses = [
    { id: 'geometry', title: 'Geometría', description: 'Geometría y Matemáticas', categoryId: 'math' },
    { id: 'fractions', title: 'Fracciones', description: '', categoryId: null },
    { id: 'algebra', title: 'Álgebra', description: '', categoryId: 'math' },
    { id: 'music', title: 'Música', description: 'Fundamentos para principiantes', categoryId: 'art' },
  ];

  it('includes only courses with a thematic match or a shared category', () => {
    const candidates = rankCourseCandidates(evaluatedModule, courses);
    expect(candidates.map(({ course }) => course.id)).toEqual(['geometry', 'fractions', 'algebra']);
  });

  it('prioritizes the lessons the student missed when the AI makes no valid selection', () => {
    const candidates = rankCourseCandidates(evaluatedModule, courses);
    expect(chooseCourseRecommendation(evaluatedModule, candidates, 'music', [true, false]))
      .toEqual({
        courseId: 'fractions',
        courseTitle: 'Fracciones',
        reason: 'Te ayuda a reforzar «Fracciones».',
      });
  });

  it('requires a topic match for courses in the general category', () => {
    const generalModule = {
      ...evaluatedModule,
      course: { ...evaluatedModule.course, category: { name: 'General' } },
    };
    const candidates = rankCourseCandidates(generalModule, courses);
    expect(candidates.map(({ course }) => course.id)).toEqual(['geometry', 'fractions']);
  });

  it('suggests continuing with a related topic when all answers are correct', () => {
    const candidates = rankCourseCandidates(evaluatedModule, courses);
    expect(chooseCourseRecommendation(evaluatedModule, candidates, null, [true, true]))
      .toMatchObject({
        courseId: 'geometry',
        reason: 'Te ayuda a ampliar lo que aprendiste en «Geometría».',
      });
  });
});
