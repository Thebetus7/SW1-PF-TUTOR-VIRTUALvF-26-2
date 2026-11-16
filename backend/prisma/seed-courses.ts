import { PrismaClient, Role, CourseStatus } from '@prisma/client';

const prisma = new PrismaClient();
const courses = [
  { title: 'HTML: estructura de páginas web', video: 'https://www.youtube.com/watch?v=UB1O30fR-EE', lessons: [
    ['Estructura del documento', 'HTML organiza la página mediante html, head y body. El head contiene metadatos y el body contiene el contenido visible. Un documento comienza declarando el tipo de documento con doctype.'],
    ['Elementos semánticos', 'Header, nav, main, section y footer describen el propósito de las regiones. Los encabezados organizan el contenido por niveles y facilitan la navegación accesible.'],
    ['Enlaces e imágenes', 'Los enlaces usan href para indicar su destino. Las imágenes usan src y un texto alternativo alt que describe su contenido o propósito.'],
  ] },
  { title: 'CSS: diseño de interfaces', video: 'https://www.youtube.com/watch?v=yfoY53QXEnI', lessons: [
    ['Selectores y cascada', 'Los selectores identifican elementos. La cascada resuelve conflictos mediante importancia, especificidad y orden de las reglas.'],
    ['Modelo de caja', 'El modelo de caja contiene contenido, relleno, borde y margen. Con border-box el ancho incluye el relleno y el borde.'],
    ['Diseño adaptable', 'Flexbox organiza elementos en un eje y Grid en filas y columnas. Las consultas de medios adaptan estilos al tamaño de pantalla.'],
  ] },
  { title: 'JavaScript: primeros pasos', video: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', lessons: [
    ['Variables y tipos', 'let permite reasignar una variable y const impide reasignar su referencia. Entre los tipos están cadenas, números y booleanos.'],
    ['Condiciones y ciclos', 'Las condiciones if y else eligen acciones según una expresión. Los ciclos for y while repiten instrucciones mientras se cumpla una condición.'],
    ['Funciones y arreglos', 'Las funciones agrupan instrucciones, reciben parámetros y pueden devolver resultados. Los arreglos contienen valores ordenados accesibles por índice.'],
  ] },
  { title: 'Git: control de versiones', video: 'https://www.youtube.com/watch?v=RGOj5yH7evk', lessons: [
    ['Repositorio e historial', 'Git registra el historial de un proyecto. git status muestra el estado de los archivos y git log muestra las confirmaciones.'],
    ['Preparar y confirmar cambios', 'git add prepara cambios y git commit guarda una instantánea con un mensaje que describe el trabajo realizado.'],
    ['Ramas y colaboración', 'Una rama permite desarrollar de forma aislada. git merge integra cambios y git push comparte confirmaciones en un repositorio remoto.'],
  ] },
];

async function main() {
  const email = process.env.SEED_TEACHER_EMAIL;
  if (!email) throw new Error('Defina SEED_TEACHER_EMAIL con el correo de un docente existente.');
  const teacher = await prisma.user.findUnique({ where: { email } });
  if (!teacher || teacher.role !== Role.TEACHER) throw new Error('El correo debe corresponder a un docente existente.');
  await prisma.$transaction(async (tx) => {
    const category = await tx.courseCategory.upsert({ where: { name: 'Desarrollo Web' }, update: {}, create: { name: 'Desarrollo Web' } });
    for (const [index, course] of courses.entries()) {
      const id = `a1000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
      const moduleId = `a2000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
      const existing = await tx.course.findUnique({ where: { id }, select: { teacherId: true } });
      if (existing && existing.teacherId !== teacher.id) throw new Error(`El curso ${id} pertenece a otro docente.`);
      await tx.course.upsert({ where: { id }, update: {}, create: { id, title: course.title, description: `Curso introductorio: ${course.title}.`, teacherId: teacher.id, categoryId: category.id, status: CourseStatus.PUBLISHED } });
      await tx.module.upsert({ where: { id: moduleId }, update: {}, create: { id: moduleId, courseId: id, title: 'Fundamentos', order: 1 } });
      for (const [lessonIndex, [title, contextText]] of course.lessons.entries()) {
        const lessonId = `a3000000-0000-4000-8000-${String((index + 1) * 100 + lessonIndex + 1).padStart(12, '0')}`;
        await tx.lesson.upsert({ where: { id: lessonId }, update: {}, create: { id: lessonId, moduleId, title, contextText, videoUrl: course.video, order: lessonIndex + 1 } });
      }
    }
  });
  console.log('Cuatro cursos y doce lecciones sembrados.');
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
