# Plan Técnico: Evaluación Interactiva con Docente Virtual Humanoide y Auditoría de Contexto

> Módulo: `docs/specs/02-docente-virtual-evaluacion/` | Especificación Base: `spec.md` | Estado: Diseñado | Metodología: SDD-Planning

---

## 1. Resumen Arquitectónico y Matriz de Componentes

### 1.1 Objetivo Técnico
Implementar la infraestructura completa de extremo a extremo para la evaluación interactiva del estudiante mediante un Docente Virtual humanoide 3D en WebGL. Esto abarca:
1. Puntos de entrada en el temario del curso con auditoría de contexto y exención de créditos.
2. Un personaje 3D procedural renderizado con **three.js** (mallas, materiales PBR, iluminación de estudio y sombras) con rig de brazos, parpadeo y visemas sincronizados.
3. El ciclo evaluativo de una pregunta por cada lección del módulo por voz o texto con persistencia en `ExamAttempt`.
4. Endpoint de verificación y diagnóstico en vivo con la API de Google Gemini.

### 1.2 Patrón Arquitectónico
- **Backend**: Arquitectura modular NestJS por capas (Controladores $\to$ Servicios de Aplicación $\to$ Acceso a Datos con Prisma ORM $\to$ Integración con Gemini AI).
- **Frontend**: Componentes modulares en React 19 con TypeScript estricto, Web Speech API para reconocimiento y síntesis de voz, y bucle de render 3D (`renderer.setAnimationLoop`) con interpolación amortiguada (`MathUtils.damp`) entre posturas y visemas.

### 1.3 Matriz de Capas y Componentes

| Capa | Archivo / Componente | Responsabilidad |
| :--- | :--- | :--- |
| **Presentación (Web)** | `frontend-web/src/pages/CourseDetailPage.tsx` | Fila del Docente Virtual en cada módulo, botón de inicio (0 créditos) y disparador del modal de contexto. |
| **Presentación (Web)** | `frontend-web/src/components/CollectedContextModal.tsx` | Modal de auditoría que expone las lecciones, objetivos y textos (`contextText`) recopilados para la IA. |
| **Presentación (Web)** | `frontend-web/src/components/TutorAvatar3D.tsx` | Docente humano 3D procedural en WebGL/three.js: pedestal, torso torneado, brazos con hombro-codo, cabeza con parpadeo, cejas y boca sincronizada a visemas. Se carga de forma diferida (`React.lazy`) en su propio chunk. |
| **Presentación (Web)** | `frontend-web/src/components/VirtualTutorEvaluatorModal.tsx` | Vista modal/pantalla de la sesión evaluativa: botón de micrófono intuitivo, caja de texto, diálogo interactivo, botón "Probar Conexión IA" y resumen final. |
| **Dominio & Casos de Uso** | `backend/src/modules/tutor/tutor.service.ts` | Orquestación pedagógica: extracción de lecciones, llamadas estructuradas a Gemini, cálculo de visemas y posturas, persistencia de intentos. |
| **Controlador & HTTP** | `backend/src/modules/tutor/tutor.controller.ts` | Endpoints REST protegidos por JWT: prueba de conexión, inicio de evaluación y calificación de turnos. |
| **Infraestructura & Datos** | `backend/src/common/services/gemini.service.ts` | Cliente resiliente de Google Generative AI con rotación de modelos vigentes y timeouts fail-fast. |
| **Persistencia** | `backend/prisma/schema.prisma` (`Exam`, `ExamAttempt`) | Registro inmutable del resultado de la evaluación del módulo sin deducción de créditos en `CreditLedger`. |

---

## 2. Diagramas de Secuencia Técnicos

### 2.1 Flujo A: Diagnóstico en Vivo de Google Gemini ("Probar Conexión IA")

```mermaid
sequenceDiagram
    autonumber
    actor Estudiante as Estudiante / Evaluador
    participant UI as VirtualTutorEvaluatorModal
    participant Canvas as TutorAvatar3D (WebGL)
    participant API as TutorController (Backend)
    participant Service as TutorService
    participant Gemini as Google Gemini API
    participant Speech as Web Speech Synthesis

    Estudiante->>UI: Clic en botón "Probar Conexión IA"
    UI->>UI: Muestra estado "Consultando Google Gemini en vivo..."
    UI->>API: POST /tutor/test-connection
    API->>Service: testGeminiConnection()
    Service->>Gemini: generateJson(prompt: frase única espontánea pedagógica)
    Gemini-->>Service: { phrase, topic, timestamp }
    Service->>Service: calculateVisemes(phrase)
    Service-->>API: TestConnectionResponseDto
    API-->>UI: 200 OK (phrase, timestamp, visemes)
    UI->>Canvas: setPose('explaining') + setVisemes(visemes)
    UI->>Speech: speak(phrase)
    Canvas->>Canvas: Anima brazos abiertos y labios según visemas
    Speech-->>UI: Locución finalizada
    UI->>Canvas: setPose('idle') + setViseme('sil')
    UI-->>Estudiante: Muestra insignia verde "Conexión a Google Gemini: Activa"
```

---

### 2.2 Flujo B: Ciclo de Evaluación Modular por Lecciones con Entrada por Voz/Texto

```mermaid
sequenceDiagram
    autonumber
    actor Estudiante as Estudiante
    participant Detail as CourseDetailPage
    participant ModalContext as CollectedContextModal
    participant EvalUI as VirtualTutorEvaluatorModal
    participant Canvas as TutorAvatar3D (WebGL)
    participant API as TutorController
    participant Service as TutorService
    participant Gemini as Google Gemini API
    participant Prisma as PostgreSQL (Prisma)

    opt Auditoría previa de datos
        Estudiante->>Detail: Clic en "Detalles de Recopilación"
        Detail->>ModalContext: Abre modal con datos del módulo
        ModalContext-->>Estudiante: Visualiza lecciones, contextText y conceptos analizados
    end

    Estudiante->>Detail: Clic en "Comenzar Evaluación (Demo)"
    Detail->>EvalUI: Abre sesión evaluativa (moduleId, totalLessons)
    EvalUI->>API: POST /tutor/module-evaluation/start { moduleId }
    API->>Service: startModuleEvaluation(userId, moduleId)
    Service->>Prisma: Busca módulo y lecciones ordenadas
    Service->>Gemini: Genera Pregunta 1 basada en Lección 1
    Gemini-->>Service: { questionText }
    Service-->>API: StartModuleEvaluationResponseDto
    API-->>EvalUI: 200 OK (Pregunta 1, visemes, totalLessons)
    EvalUI->>Canvas: setPose('explaining')
    EvalUI->>EvalUI: Reproduce voz de Pregunta 1

    loop Por cada lección (1..N)
        alt Entrada por Voz
            Estudiante->>EvalUI: Clic en botón Micrófono (1 toque)
            EvalUI->>Canvas: setPose('listening')
            EvalUI->>EvalUI: Web Speech Recognition escucha y transcribe
            EvalUI-->>Estudiante: Muestra transcripción en tiempo real
        else Entrada por Texto
            Estudiante->>EvalUI: Escribe respuesta en input y presiona Enviar
        end

        EvalUI->>API: POST /tutor/module-evaluation/answer { moduleId, lessonIndex, userResponse }
        API->>Service: answerModuleEvaluation(userId, dto)
        Service->>Gemini: Evalúa respuesta vs contextText de la lección
        Gemini-->>Service: { isCorrect, feedbackText, nextQuestion, isFinished }
        opt Si es la última lección
            Service->>Prisma: Upsert Exam & crea ExamAttempt (score, isPassed, aiFeedback)
        end
        Service-->>API: AnswerModuleEvaluationResponseDto
        API-->>EvalUI: 200 OK (feedbackText, avatarEmotion, nextQuestion, finalSummary)
        EvalUI->>Canvas: setPose(avatarEmotion: 'celebrating' | 'explaining')
        EvalUI->>EvalUI: Reproduce audio de retroalimentación
    end

    EvalUI-->>Estudiante: Despliega dictamen pedagógico final y resumen formativo
```

---

## 3. Contratos de Código e Interfaces Tipadas

### 3.1 Modelos de Dominio y Tipos Inmutables

```typescript
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
  contextText: string;
}

export interface ModuleEvaluationContext {
  moduleId: string;
  moduleTitle: string;
  courseTitle: string;
  lessons: CollectedLessonSummary[];
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
  correctAnswersCount: number;
  totalQuestions: number;
  closingRemarks: string;
  attemptId?: string;
}
```

---

### 3.2 DTOs de Entrada y Salida (Backend NestJS)

```typescript
// backend/src/modules/tutor/dto/test-connection.dto.ts
import { IsOptional, IsBoolean } from 'class-validator';

export class TestConnectionDto {
  @IsOptional()
  @IsBoolean()
  demoMode?: boolean = true;
}

export interface TestConnectionResponseDto {
  success: boolean;
  provider: 'Google Gemini';
  modelUsed: string;
  phrase: string;
  timestamp: string;
  visemes: VisemeFrame[];
}

// backend/src/modules/tutor/dto/module-evaluation.dto.ts
import { IsNotEmpty, IsUUID, IsInt, Min, IsString } from 'class-validator';

export class StartModuleEvaluationDto {
  @IsNotEmpty()
  @IsUUID()
  moduleId: string;
}

export interface StartModuleEvaluationResponseDto {
  moduleId: string;
  moduleTitle: string;
  totalLessons: number;
  currentLessonIndex: number;
  currentLessonTitle: string;
  questionText: string;
  visemes: VisemeFrame[];
  collectedContext: {
    lessons: Array<{
      id: string;
      order: number;
      title: string;
      contextSummary: string;
    }>;
  };
}

export class AnswerModuleEvaluationDto {
  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @IsInt()
  @Min(0)
  lessonIndex: number;

  @IsString()
  @IsNotEmpty()
  userResponse: string;
}

export interface AnswerModuleEvaluationResponseDto {
  isCorrect: boolean;
  feedbackText: string;
  visemes: VisemeFrame[];
  avatarEmotion: 'explaining' | 'listening' | 'celebrating' | 'encouraging';
  hasNextLesson: boolean;
  nextQuestion?: {
    lessonIndex: number;
    lessonTitle: string;
    questionText: string;
  };
  finalSummary?: {
    approved: boolean;
    scorePercentage: number;
    closingRemarks: string;
    attemptId?: string;
  };
}
```

---

### 3.3 Puertos de Interfaz de Servicios (Backend)

```typescript
// backend/src/modules/tutor/interfaces/tutor-service.interface.ts

export interface ITutorService {
  testGeminiConnection(): Promise<TestConnectionResponseDto>;
  
  startModuleEvaluation(
    userId: string,
    dto: StartModuleEvaluationDto,
  ): Promise<StartModuleEvaluationResponseDto>;

  answerModuleEvaluation(
    userId: string,
    dto: AnswerModuleEvaluationDto,
  ): Promise<AnswerModuleEvaluationResponseDto>;

  getModuleCollectedContext(
    moduleId: string,
  ): Promise<ModuleEvaluationContext>;
}
```

---

## 4. Garantías de Runtime, Persistencia e Integridad Relacional

### 4.1 Integridad del Grafo de Entidades y Claves Foráneas
- **Relaciones Prisma**:
  - `Module -> Exam`: Vinculado con `onDelete: Cascade`. Si un docente borra un módulo, las configuraciones evaluativas se limpian automáticamente.
  - `Exam -> ExamAttempt`: Vinculado con `onDelete: Cascade`.
  - `User -> ExamAttempt`: Vinculado con `onDelete: Restrict` según la Constitución (registros académicos inmutables).
- **Exoneración de Créditos**:
  - Los endpoints de `/tutor/module-evaluation/*` validan el JWT de autenticación del estudiante pero **no descuentan balance** en `CreditLedger`, garantizando acceso libre con balance cero ($0$ créditos) para la demostración.

### 4.2 Patrón de Selección Tridimensional (The 3-Way Selector Pattern)
1. **Selección Existente**:
   - Al iniciar la evaluación de un módulo, el servicio consulta si ya existe un `Exam` asociado a `moduleId`. Si existe, asocia el intento a ese registro.
2. **Creación en Caliente (*On-the-Fly*)**:
   - Si no existe un `Exam` registrado para el módulo, el servicio crea automáticamente en la base de datos el `Exam` modular (`title: "Evaluación con Docente Virtual - " + module.title`) en una transacción atómica sin interrumpir al estudiante.
3. **Estado Neutro / Zero-State Invariant**:
   - Si el módulo posee $0$ lecciones publicadas, el backend retorna una excepción controlada (`BadRequestException('El módulo seleccionado no posee lecciones para evaluar')`) y el frontend deshabilita el botón con la leyenda amigable: *"Sin lecciones publicadas para evaluar"*. Jamás se bloquea la interfaz.

### 4.3 Evolución del Esquema y Migraciones
- **Aprovechamiento de Esquema Vigente**:
  - Los modelos `Exam` y `ExamAttempt` ya poseen los campos requeridos (`moduleId`, `title`, `passScore`, `score`, `isPassed`, `aiFeedback`).
  - No se requieren migraciones destructivas ni alteración de claves existentes (`schemaVersion: 1.1`).

### 4.4 Resiliencia de I/O, Web Speech y Fallbacks
1. **Google Gemini API**:
   - Timeout preventivo estricto de 10 segundos implementado en `GeminiService`. Si la API de Google demora o se agota la cuota en Free Tier, se activa la respuesta heurística pedagógica determinista sin arrojar pantalla en blanco.
2. **Reconocimiento de Voz en Cliente**:
   - Detección de soporte para `webkitSpeechRecognition` o `SpeechRecognition`. Si el navegador no tiene soporte o el usuario deniega el permiso de micrófono, el sistema conmuta fluidamente al cuadro de entrada de texto mostrando un aviso contextual no bloqueante.

---

## 5. Personaje 3D del Docente Virtual (`TutorAvatar3D.tsx`)

### 5.1 Motor y Enfoque
El docente es un **personaje 3D procedural** construido íntegramente en código sobre **three.js** (sin assets `.glb`/`.vrm` ni descargas externas, por lo que viaja con el bundle y funciona offline):

- `WebGLRenderer` con `antialias`, `alpha`, `PCFSoftShadowMap` y `NeutralToneMapping`.
- `PerspectiveCamera` (fov 30) con paralaje sutil siguiendo el puntero, respetando `prefers-reduced-motion`.
- Iluminación de estudio: `HemisphereLight` + `DirectionalLight` con sombras + relleno frío + `PointLight` de contorno.
- Cuerpo: `LatheGeometry` con perfil torneado (comprimido en Z para dar profundidad humana), brazos con jerarquía hombro $\to$ codo $\to$ mano, y pedestal que ancla la figura.

**Evidencia visual del render (captura real en WebGL):**

| Reposo | Explicando | Escuchando | Celebrando |
| :---: | :---: | :---: | :---: |
| ![Reposo](../../assets/tutor-3d/pose-idle.png) | ![Explicando](../../assets/tutor-3d/pose-explaining.png) | ![Escuchando](../../assets/tutor-3d/pose-listening.png) | ![Celebrando](../../assets/tutor-3d/pose-celebrating.png) |

### 5.2 Anatomía y Elementos Visuales
1. **Torso y Vestimenta**:
   - Blazer azul Skylearn torneado, panel de camisa en V generado con `BufferGeometry` a medida (anillos de ancho creciente) y corbata de acento solar alineada a la superficie real del pecho.
2. **Cabeza y Rasgos Faciales**:
   - Tono de piel cálido, casquete de cabello inclinado con flequillo, orejas, mejillas y nariz modelados en malla.
   - Ojos con esclerótica, iris, pupila y brillo; el parpadeo se anima escalando el grupo ocular y ocurre cada 2.2–5.4 s.
   - Boca en dos mallas complementarias: sonrisa (toro) y apertura (elipsoide) que se interpolan entre visemas (`sil`, `aa`, `E`, `ih`, `oh`, `ou`).
3. **Cinemática de Brazos y Manos Articulados** (rotaciones objetivo interpoladas con `MathUtils.damp`):
   - **Postura `'idle'`**: brazos relajados con una leve apertura hacia fuera.
   - **Postura `'explaining'`**: brazo derecho adelantado con palma abierta y balanceo suave al ritmo de la voz.
   - **Postura `'listening'`**: antebrazo flexionado llevando la mano a la altura del mentón, cabeza inclinada.
   - **Postura `'celebrating'`**: ambos brazos en alto formando una V y cejas elevadas.
   - **Postura `'encouraging'`**: ambas manos abiertas hacia el frente invitando a reflexionar.

---

## 6. Estrategia de Testing y Validación Dual

### 6.1 Pruebas de Caja Blanca (Unit Tests)
- `backend/test/tutor.service.spec.ts`:
  - Verificación del cálculo temporal de visemas para textos en español.
  - Generación de posturas emocionales del avatar a partir de la evaluación de la respuesta.
  - Orquestación de turnos (lección $0 \to$ lección $1 \to \dots \to$ final).

### 6.2 Pruebas de Caja Negra (BDD / E2E Integration Tests)
- `backend/test/tutor.e2e-spec.ts`:
  - `POST /tutor/test-connection`: Retorna 200 OK con frase dinámica no vacía, timestamp y lista de visemas.
  - `POST /tutor/module-evaluation/start`: Retorna 200 OK con la primera pregunta y contexto recopilado de lecciones existentes.
  - `POST /tutor/module-evaluation/answer`: Procesa la respuesta de la lección, retorna retroalimentación con postura y persiste `ExamAttempt` con costo 0 créditos al completar el módulo.
