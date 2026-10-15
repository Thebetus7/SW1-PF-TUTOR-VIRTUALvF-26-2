// backend/src/modules/tutor/tutor.service.spec.ts
import { TutorService } from './tutor.service';

describe('TutorService (Unit Tests)', () => {
  let tutorService: TutorService;

  beforeEach(() => {
    // Instanciamos con mocks de prisma y gemini para pruebas de lógica pura
    const mockPrisma = {} as any;
    const mockGemini = {} as any;
    tutorService = new TutorService(mockPrisma, mockGemini);
  });

  it('calculateVisemes debe mapear vocales en español a visemas anatómicos correspondientes', () => {
    const text = 'Hola estudiante';
    const visemes = tutorService.calculateVisemes(text);

    expect(Array.isArray(visemes)).toBe(true);
    expect(visemes.length).toBeGreaterThan(0);

    // Debe comenzar con sil (silencio) y terminar con sil
    expect(visemes[0].shape).toBe('sil');
    expect(visemes[visemes.length - 1].shape).toBe('sil');

    // Debe contener formas 'oh', 'aa', 'E', 'ih', 'ou' según las vocales de la frase
    const shapes = visemes.map((v) => v.shape);
    expect(shapes).toContain('oh'); // de H'o'la
    expect(shapes).toContain('aa'); // de Hol'a'
    expect(shapes).toContain('E');  // de 'e'studiant'e'
    expect(shapes).toContain('ih'); // de estud'i'ante
  });

  it('calculateVisemes debe avanzar el tiempo en milisegundos de forma creciente y monótona', () => {
    const text = 'Programación interactiva';
    const visemes = tutorService.calculateVisemes(text);

    for (let i = 1; i < visemes.length; i++) {
      expect(visemes[i].timeMs).toBeGreaterThan(visemes[i - 1].timeMs);
    }
  });

  it('calculateVisemes debe manejar cadenas vacías retornando frames inicial y final seguros', () => {
    const text = '';
    const visemes = tutorService.calculateVisemes(text);

    expect(visemes.length).toBe(2);
    expect(visemes[0].shape).toBe('sil');
    expect(visemes[1].shape).toBe('sil');
  });
});
