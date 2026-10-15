# Especificación Funcional: Evaluación Interactiva con Docente Virtual Humano y Auditoría de Contexto

> Módulo: `docs/specs/02-docente-virtual-evaluacion/` | Estado: Aprobada | Metodología: SDD-Spec-High

---

## 1. Contexto, Objetivos y Anclaje al Flujo Global

- **Objetivo**: Proveer una experiencia de evaluación pedagógica oral y escrita guiada por un Docente Virtual humanoide articulado que evalúa secuencialmente los conceptos de cada lección del módulo sin consumir créditos (modo demostración abierto), permitiendo auditar transparentemente los datos de contexto recopilados y validar en tiempo real la conectividad con la API de Google Gemini mediante síntesis de voz y animación gestual (brazos y labios).
- **Ubicación en el Flujo Global**: Anclado a la **Fase II: Ejecución Pedagógica y Evaluación (Punto de Control: Evaluación Modular)** y a la **Fase IV: Interacción Multimodal Humanizada (Tutor Digital)** de [`docs/constitution.md`](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/docs/constitution.md#L49-L70).
- **Alcance**:
  - Incorporación en el temario del curso ([`CourseDetailPage.tsx`](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/frontend-web/src/pages/CourseDetailPage.tsx#L191-L235)) de la opción final de "Evaluación Práctica con Docente Virtual" en cada módulo.
  - Exoneración total de consumo de créditos (0 créditos requeridos, acceso irrestricto sin bloqueo por paywall para fines de demostración técnica).
  - Modal informativo de auditoría ("Detalles de Recopilación") que expone las lecciones, los textos de contexto (`contextText`) y conceptos clave recopilados para formular las preguntas.
  - Avatar humano estilizado 2.5D articulado con renderizado reactivo, expresiones faciales, parpadeo, sincronización labial (visemas) y movimiento cinemático de brazos/manos según el estado (explicando, escuchando, felicitando).
  - Interacción dual por voz (un solo clic para iniciar reconocimiento continuo/por turnos) y caja de texto para envío manual, con síntesis de voz sincronizada en cada respuesta.
  - Mecánica de evaluación progresiva: formulación de exactamente 1 pregunta por cada lección registrada en el módulo/curso, concluyendo con un dictamen pedagógico integrador.
  - Botón discreto de diagnóstico ("Probar Conexión IA") que envía una solicitud al backend para consultar a Google Gemini en vivo, generando una frase original única que el avatar pronuncia en voz alta para certificar la conexión activa con la API.
- **Actores**:
  - **Estudiante (Learner)**: Interactúa con el docente virtual mediante voz o texto para demostrar dominio conceptual y audita los datos recopilados en el modal.
  - **Docente / Sistema Curricular**: Provee los contenidos estructurados de lecciones y videos que nutren el contexto del evaluador.
  - **Google Gemini API**: Motor de inteligencia artificial que genera dinámicamente las preguntas pedagógicas contextualizadas, la retroalimentación cualitativa y las frases de validación de conexión.

---

## 2. Historias de Usuario (HU)

### HU-01: Acceso Universal a la Evaluación del Docente Virtual y Auditoría de Datos en el Temario
**Como** estudiante que revisa los módulos de un curso,  
**Quiero** encontrar al final de cada módulo la opción de "Evaluación con Docente Virtual" sin restricciones de créditos junto a un botón para ver los detalles de los datos recopilados,  
**Para** poner a prueba mis conocimientos de todas las lecciones del módulo de manera inmediata y comprender con transparencia qué información utiliza la inteligencia artificial para evaluarme.

---

### HU-02: Avatar Humano Articulado con Expresión Gestual de Brazos y Sincronización Labial
**Como** estudiante en la sesión evaluativa,  
**Quiero** interactuar con un avatar humano estilizado y empático que mueva sus brazos didácticamente y sincronice sus labios al hablar según el contexto de su respuesta,  
**Para** disfrutar de una experiencia inmersiva, profesional y humanizada que supere las representaciones estáticas o esquemáticas simplistas.

---

### HU-03: Ciclo Evaluativo Multimodal Continuo por Voz y Texto (1 Pregunta por Lección)
**Como** estudiante evaluado,  
**Quiero** responder las preguntas del docente virtual hablando de forma intuitiva con un solo clic o escribiendo en un cuadro de texto, respondiendo una pregunta clave por cada lección del módulo,  
**Para** validar mi comprensión lección por lección de forma ágil, recibiendo corrección inmediata audible y visual hasta obtener el dictamen final.

---

### HU-04: Verificación Discreta de Conectividad en Tiempo Real con la API de Google
**Como** estudiante o evaluador de la demostración,  
**Quiero** contar con un botón discreto de prueba que solicite a Google Gemini una respuesta original generada en ese mismo instante y la reproduzca en voz alta,  
**Para** tener la certeza física de que el sistema está conectado operativamente con los servicios de inteligencia artificial de Google y no reproduciendo grabaciones estáticas.

---

## 3. Requisitos Funcionales (RF con Sintaxis EARS)

### Requisitos de HU-01: Ubicación en Temario, Exoneración de Créditos y Modal de Datos
- **`RF-01.1` [Ubiquitous]**: El sistema deberá desplegar al final de la lista de lecciones de cada módulo una fila destacada correspondiente a la "Evaluación Práctica con Docente Virtual".
- **`RF-01.2` [Event-Driven]**: CUANDO el estudiante pulsa el botón "Comenzar Evaluación con Docente Virtual", el sistema deberá abrir la interfaz de evaluación sin descontar créditos de su balance ni activar el modal de paywall (`creditsRequired: 0`).
- **`RF-01.3` [Event-Driven]**: CUANDO el estudiante pulsa el botón "Detalles de Recopilación" de la evaluación, el sistema deberá abrir un modal interactivo que liste los títulos de todas las lecciones del módulo, los fragmentos de contexto pedagógico (`contextText`) extraídos y los objetivos de evaluación que alimentarán el prompt de la IA.
- **`RF-01.4` [Unwanted Behavior / Fallback]**: SI el módulo no cuenta con lecciones registradas o su contenido es vacío, ENTONCES el sistema deberá mostrar un estado neutro informativo indicando que se requiere al menos una lección para iniciar la evaluación, deshabilitando el inicio sin romper la navegación.

---

### Requisitos de HU-02: Diseño y Cinemática del Avatar Humano 2.5D
- **`RF-02.1` [Ubiquitous]**: El sistema deberá representar al Docente Virtual mediante una figura humana estilizada compuesta por rostro anatómico (ojos con parpadeo periódico, cejas móviles, boca con visemas) y torso con brazos articulados visibles.
- **`RF-02.2` [State-Driven]**: MIENTRAS el Docente Virtual esté verbalizando una pregunta o retroalimentación, el sistema deberá ejecutar una animación coordinada de gesticulación de brazos (manos abiertas explicativas) y visemas labiales sincronizados con el audio emitido.
- **`RF-02.3` [State-Driven]**: MIENTRAS el estudiante esté hablando o el micrófono se encuentre activo, el sistema deberá situar los brazos del avatar en postura atenta de escucha (brazo en mentón o manos juntas relajadas) y mostrar un indicador visual de atención.
- **`RF-02.4` [Event-Driven]**: CUANDO la respuesta del estudiante sea evaluada como correcta o aprobatoria, el sistema deberá activar una animación de celebración o pulgar arriba en los brazos del avatar junto con una expresión facial sonriente.

---

### Requisitos de HU-03: Mecánica de Evaluación Guiada (1 Pregunta por Lección) y Modos de Entrada
- **`RF-03.1` [Ubiquitous]**: El sistema deberá estructurar la sesión evaluativa en un número total de preguntas exactamente igual a la cantidad de lecciones existentes en el módulo seleccionado ($N$ lecciones = $N$ preguntas).
- **`RF-03.2` [Event-Driven]**: CUANDO se inicia la evaluación, el sistema deberá solicitar al backend la primera pregunta formulada por Gemini fundamentada específicamente en el contenido de la primera lección del módulo.
- **`RF-03.3` [Event-Driven]**: CUANDO el estudiante pulsa el botón de micrófono, el sistema deberá activar el reconocimiento de voz del navegador (Web Speech API) con un único toque, transcribir en tiempo real lo dicho y mostrar feedback sonoro/visual de captura.
- **`RF-03.4` [Optional Feature]**: DONDE el estudiante prefiera no utilizar micrófono o el navegador no cuente con permisos de audio, el sistema deberá permitir escribir la respuesta en un campo de texto y enviarla mediante un botón visible o la tecla Enter.
- **`RF-03.5` [Event-Driven]**: CUANDO el estudiante envía su respuesta (por voz o texto), el sistema deberá enviar la respuesta a la API de evaluación, reproducir en audio la retroalimentación del docente virtual animando sus labios y brazos, y avanzar automáticamente a la pregunta de la siguiente lección.
- **`RF-03.6` [State-Driven]**: MIENTRAS se hayan respondido todas las preguntas de las lecciones del módulo, el sistema deberá presentar un veredicto pedagógico de cierre con resumen de fortalezas, calificación cualitativa y felicitación animada del avatar.

---

### Requisitos de HU-04: Botón de Diagnóstico y Certificación de Google API en Tiempo Real
- **`RF-04.1` [Ubiquitous]**: El sistema deberá incluir en la interfaz del estudiante un botón discreto de diagnóstico denominado "Probar Conexión IA" ubicado en la barra de herramientas del tutor.
- **`RF-04.2` [Event-Driven]**: CUANDO el usuario presiona el botón "Probar Conexión IA", el frontend deberá enviar una petición `POST /tutor/test-connection` al backend.
- **`RF-04.3` [Ubiquitous]**: El backend deberá consultar de forma no determinista a la API de Google Gemini solicitando una frase pedagógica o saludo fresco y original único que incluya la hora o un dato dinámico demostrable.
- **`RF-04.4` [Event-Driven]**: CUANDO el frontend recibe la respuesta del backend, el sistema deberá verbalizar de inmediato el mensaje mediante síntesis de voz, sincronizando los visemas del avatar e iluminando un indicador verde de "Google Gemini Conectado (En Vivo)".
- **`RF-04.5` [Unwanted Behavior / Fallback]**: SI la consulta a la API de Google Gemini excede el tiempo límite (timeout) o falla la red, ENTONCES el sistema deberá notificar al usuario de forma no bloqueante con un mensaje descriptivo y un botón para reintentar la prueba sin interrumpir la sesión del estudiante.

---

## 4. Criterios de Aceptación y Escenarios BDD (Gherkin)

### Escenarios de HU-01: Acceso en Temario y Modal de Recopilación

#### SC-01.1: Visualización y Acceso Gratuito a la Evaluación del Módulo
```gherkin
Given que el estudiante está autenticado y visualiza el detalle del curso con 3 lecciones en el Módulo 1
And su balance de créditos es de 0 créditos
When el estudiante revisa el temario del Módulo 1
Then observa al final de las lecciones la tarjeta "Evaluación Práctica con Docente Virtual"
And el botón de acción indica "Comenzar Evaluación (Demo)"
When el estudiante hace clic en "Comenzar Evaluación"
Then el sistema abre la vista de la evaluación del Docente Virtual
And no se descuenta ningún crédito ni se presenta la pantalla de paywall
```

#### SC-01.2: Apertura del Modal de Datos Recopilados para la Demostración
```gherkin
Given que el estudiante se encuentra en la tarjeta del Docente Virtual en el temario
When hace clic en el botón secundario "Detalles de Recopilación"
Then se despliega un modal accesible con el título "Contexto Recopilado para el Docente Virtual"
And el modal lista los títulos de las 3 lecciones del módulo
And muestra un resumen del texto pedagógico ("contextText") de cada lección
And presenta el botón "Cerrar" para retornar al temario sin alterar el estado
```

#### SC-01.3: Módulo sin Lecciones Registradas (Zero-State)
```gherkin
Given que un profesor ha creado un módulo sin ninguna lección agregada
When el estudiante o docente visualiza dicho módulo
Then la opción del Docente Virtual muestra un estado inactivo amigable: "Sin lecciones publicadas para evaluar"
And el botón de iniciar evaluación se encuentra deshabilitado para prevenir llamadas inválidas a la IA
```

---

### Escenarios de HU-02: Dinámica Visual y Gestual del Avatar Humano

#### SC-02.1: Avatar Articulado Explicando con Movimiento de Brazos y Labios
```gherkin
Given que el Docente Virtual inicia la formulación de una pregunta pedagógica
When el sistema reproduce la voz sintética del enunciado
Then el avatar humano mueve los brazos hacia el frente en ademán explicativo
And la boca del avatar adopta visemas sincronizados con la cadencia de la locución
And al finalizar de hablar, los brazos retornan a su posición de reposo neutral
```

#### SC-02.2: Avatar en Modo de Escucha Activa durante la Respuesta del Estudiante
```gherkin
Given que la pregunta ha sido formulada y el estudiante activa el micrófono para responder
When el reconocedor de voz detecta entrada de audio
Then el avatar humano adopta una postura de atención (brazo en mentón e inclinación leve de cabeza)
And un indicador de audio muestra ondas pulsantes reflejando la captura de voz
```

#### SC-02.3: Reacción Gestual ante Respuesta Satisfactoria
```gherkin
Given que el estudiante envía una respuesta acertada a la pregunta de la lección
When la IA califica positivamente el razonamiento del estudiante
Then el avatar realiza un gesto afirmativo con sus brazos (brazo levantado con pulgar arriba o aplauso sutil)
And expresa una retroalimentación auditiva y escrita de refuerzo positivo
```

---

### Escenarios de HU-03: Ciclo Evaluativo de 1 Pregunta por Lección

#### SC-03.1: Ciclo Completo de Evaluación Secuencial por Lecciones
```gherkin
Given que el módulo evaluado contiene exactamente 2 lecciones: "Lección 1: Variables" y "Lección 2: Bucles"
When se inicia la evaluación con el Docente Virtual
Then el tutor formula la Pregunta 1 orientada exclusivamente al concepto de "Variables"
When el estudiante responde por voz o texto a la Pregunta 1
Then el tutor proporciona retroalimentación hablada y gestual
And formula a continuación la Pregunta 2 orientada a "Bucles"
When el estudiante responde a la Pregunta 2
Then el tutor emite la retroalimentación final de la lección 2
And presenta una pantalla de dictamen con felicitación, porcentaje de acierto y opción de regresar al temario
```

#### SC-03.2: Uso Dual de Micrófono o Entrada de Texto
```gherkin
Given que el estudiante se encuentra en el turno de respuesta
When el estudiante escribe su respuesta en el input de texto y presiona "Enviar"
Then el sistema procesa la respuesta idénticamente a una entrada por voz
And el avatar inicia su retroalimentación hablada y textual sin discrepancias funcionales
```

---

### Escenarios de HU-04: Prueba de Conexión en Vivo con Google Gemini

#### SC-04.1: Prueba Exitosa de Frase Original Dinámica de la IA
```gherkin
Given que el usuario se encuentra en la interfaz del tutor
When hace clic en el botón discreto "Probar Conexión IA"
Then se realiza una petición al backend hacia el endpoint "/tutor/test-connection"
And el backend genera con Google Gemini una frase espontánea y no estática
And el navegador reproduce dicha frase en voz alta mientras el avatar mueve sus labios
And una insignia temporal confirma "Conexión a Google Gemini: Activa y Respondiendo"
```

#### SC-04.2: Degradación y Manejo de Error en Caso de Fallo de Conexión
```gherkin
Given que el servicio externo de Google experimenta intermitencia o timeout
When el usuario presiona el botón "Probar Conexión IA"
Then el sistema muestra una alerta no invasiva: "No se pudo contactar a Google Gemini en este instante"
And el avatar informa mediante voz de respaldo que el servicio se encuentra en reintento
And la sesión de evaluación del estudiante permanece abierta sin congelamiento de UI
```

---

## 5. Contratos de Datos y Especificación de Interfaces

### 5.1 Datos de Entrada (Request Payloads)

#### Endpoint `POST /tutor/test-connection`
| Parámetro | Tipo | Requerido | Descripción / Validación |
| :--- | :--- | :--- | :--- |
| `demoMode` | Boolean | No | Indicador opcional de modo demostración (por defecto: `true`). |

#### Endpoint `POST /tutor/module-evaluation/start`
| Parámetro | Tipo | Requerido | Descripción / Validación |
| :--- | :--- | :--- | :--- |
| `moduleId` | String (UUID) | Sí | Identificador del módulo cuyas lecciones se recopilan. Debe existir en la base de datos. |

#### Endpoint `POST /tutor/module-evaluation/answer`
| Parámetro | Tipo | Requerido | Descripción / Validación |
| :--- | :--- | :--- | :--- |
| `moduleId` | String (UUID) | Sí | Identificador del módulo en evaluación. |
| `lessonIndex` | Entero | Sí | Índice de la lección actual evaluada ($0 \le \text{lessonIndex} < N$). |
| `userResponse` | String | Sí | Transcripción de voz o texto ingresado por el estudiante (mínimo 2 caracteres). |

---

### 5.2 Datos de Salida (Response Payloads)

#### Respuesta de `POST /tutor/test-connection`
```typescript
interface TestConnectionResponse {
  success: boolean;
  provider: 'Google Gemini';
  modelUsed: string;
  phrase: string;              // Frase original única generada en tiempo real
  timestamp: string;           // ISO 8601 del momento de generación
  visemes: Array<{ timeMs: number; shape: 'sil' | 'aa' | 'E' | 'ih' | 'oh' | 'ou' }>;
}
```

#### Respuesta de `POST /tutor/module-evaluation/start`
```typescript
interface StartModuleEvaluationResponse {
  moduleId: string;
  moduleTitle: string;
  totalLessons: number;
  currentLessonIndex: number;
  currentLessonTitle: string;
  questionText: string;        // Pregunta generada por Gemini para la lección actual
  visemes: Array<{ timeMs: number; shape: 'sil' | 'aa' | 'E' | 'ih' | 'oh' | 'ou' }>;
  collectedContext: {
    lessons: Array<{
      id: string;
      title: string;
      contextSummary: string;
    }>;
  };
}
```

#### Respuesta de `POST /tutor/module-evaluation/answer`
```typescript
interface AnswerModuleEvaluationResponse {
  isCorrect: boolean;
  feedbackText: string;        // Explicación empática del avatar
  visemes: Array<{ timeMs: number; shape: 'sil' | 'aa' | 'E' | 'ih' | 'oh' | 'ou' }>;
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
  };
}
```

---

## 6. Integridad Relacional y Políticas Antihuérfanos

1. **Mapeo Curricular Sin Huérfanos**:
   - Toda evaluación con el Docente Virtual está vinculada a un `Module` existente. Si el módulo es eliminado del curso, cualquier sesión activa se descarta en memoria sin persistir estados inconsistentes.
2. **Acceso Gratuito con Balance Cero (0 Créditos)**:
   - El controlador backend de la evaluación modular verifica la existencia del módulo y estudiante, pero omite deliberadamente la deducción de la tabla `CreditLedger` para garantizar su disponibilidad incondicional en entornos de demostración.
3. **Manejo de Respuestas Incompletas**:
   - Si el estudiante abandona la sesión antes de completar todas las lecciones, el sistema no bloquea el avance general y permite reiniciar la evaluación desde la primera lección sin penalización.
