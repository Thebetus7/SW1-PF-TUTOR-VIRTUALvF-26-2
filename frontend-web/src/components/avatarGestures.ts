export type AvatarGesture =
  | "rest"
  | "open"
  | "point"
  | "think"
  | "count"
  | "encourage"
  | "celebrate"
  | "listen";
export type GestureSelection = "auto" | "demo" | AvatarGesture;
export const GESTURE_LABELS: Record<AvatarGesture, string> = {
  rest: "En reposo",
  open: "Explicando con las manos",
  point: "Señalando una idea",
  think: "Reflexionando",
  count: "Enumerando conceptos",
  encourage: "Animando",
  celebrate: "Felicitando",
  listen: "Escuchando",
};
const explanation: AvatarGesture[] = [
  "open",
  "point",
  "count",
  "think",
  "open",
  "encourage",
];
const demonstration: AvatarGesture[] = [
  "open",
  "point",
  "count",
  "think",
  "listen",
  "encourage",
  "celebrate",
  "rest",
];
// Rules inspect only the text already spoken; later words must not trigger gestures early.
export function gestureForSpokenText(
  text: string,
  end: number,
): AvatarGesture | undefined {
  const spoken = text.slice(0, Math.max(0, end));
  const sentence = spoken
    .slice(
      Math.max(
        spoken.lastIndexOf("."),
        spoken.lastIndexOf("!"),
        spoken.lastIndexOf(";"),
        spoken.length - 110,
      ) + 1,
    )
    .toLocaleLowerCase("es");
  const rules: Array<[RegExp, AvatarGesture]> = [
    [
      /(?<!\p{L})(muy bien|excelente|correcto|felicitaciones|lo lograste|bien hecho)(?!\p{L})/u,
      "celebrate",
    ],
    [
      /(?<!\p{L})(no te preocupes|intenta|tranquilo|tranquila|repasa|puedes hacerlo|vamos paso a paso)(?!\p{L})/u,
      "encourage",
    ],
    [
      /(?<!\p{L})(primero|segundo|tercero|en primer lugar|por una parte|por otra parte)(?!\p{L})/u,
      "count",
    ],
    [
      /(?<!\p{L})(recuerda|importante|fundamental|atenci[oó]n|idea clave)(?!\p{L})/u,
      "point",
    ],
    [
      /(?<!\p{L})(piensa|reflexiona|imagina|por qu[eé]|qu[eé] ocurrir[ií]a)(?!\p{L})/u,
      "think",
    ],
    [
      /(?<!\p{L})(por ejemplo|observa|veamos|en otras palabras|es decir)(?!\p{L})/u,
      "open",
    ],
  ];
  // Prefer the most recently spoken clause so a new idea can change a gesture.
  const clause = sentence.slice(sentence.lastIndexOf(",") + 1);
  for (const [pattern, gesture] of rules)
    if (pattern.test(clause)) return gesture;
  for (const [pattern, gesture] of rules)
    if (pattern.test(sentence)) return gesture;
  if (/[?¿]\s*$/u.test(spoken)) return "think";
  // A completed sentence lets the hands settle; a comma alone does not force a pose.
  if (/[.!;]\s*$/u.test(spoken)) return "rest";
  return undefined;
}
export function selectGesture(options: {
  selection: GestureSelection;
  elapsed: number;
  speaking: boolean;
  listening: boolean;
  pose?: string;
  speechText?: string;
  spokenEnd?: number;
}): AvatarGesture {
  if (options.selection === "demo")
    return demonstration[
      Math.floor(options.elapsed / 3.5) % demonstration.length
    ];
  if (options.selection !== "auto") return options.selection;
  if (options.listening) return "listen";
  if (!options.speaking) return "rest";
  const semantic = gestureForSpokenText(
    options.speechText || "",
    options.spokenEnd || 0,
  );
  const index = Math.floor(options.elapsed / 3.5);
  // Semantic emphasis is a short accent, never a permanent override for a whole sentence.
  if (semantic && options.elapsed % 3.5 < 1.8) return semantic;
  const variation = explanation[index % explanation.length];
  if (semantic)
    return variation === semantic
      ? explanation[(index + 1) % explanation.length]
      : variation;
  if (options.pose === "celebrating" && index % 3 === 0) return "celebrate";
  if (options.pose === "encouraging" && index % 3 === 0) return "encourage";
  return explanation[index % explanation.length];
}
