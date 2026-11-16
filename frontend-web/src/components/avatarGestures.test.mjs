import test from "node:test";
import assert from "node:assert/strict";
import { selectGesture, gestureForSpokenText } from "./avatarGestures.ts";
test("automatic speech varies gestures instead of holding the feedback pose", () => {
  for (const pose of ["explaining", "celebrating", "encouraging"]) {
    const poses = new Set(
      [0, 4, 8, 12, 16, 20].map((elapsed) =>
        selectGesture({
          selection: "auto",
          elapsed,
          speaking: true,
          listening: false,
          pose,
        }),
      ),
    );
    assert.ok(poses.size >= 4);
  }
});
test("listening takes priority and stopping speech returns the avatar to rest", () => {
  assert.equal(
    selectGesture({
      selection: "auto",
      elapsed: 10,
      speaking: true,
      listening: true,
    }),
    "listen",
  );
  assert.equal(
    selectGesture({
      selection: "auto",
      elapsed: 10,
      speaking: false,
      listening: false,
      pose: "celebrating",
    }),
    "rest",
  );
});
test("demonstration covers all eight gestures without requiring audio", () => {
  const poses = new Set(
    Array.from({ length: 8 }, (_, index) =>
      selectGesture({
        selection: "demo",
        elapsed: index * 3.5,
        speaking: false,
        listening: false,
      }),
    ),
  );
  assert.equal(poses.size, 8);
});

test("semantic cues follow words actually spoken and change with clauses", () => {
  const text = "Primero veremos variables, recuerda usar nombres claros.";
  assert.equal(gestureForSpokenText(text, 7), "count");
  assert.equal(
    gestureForSpokenText(text, text.indexOf("recuerda") + 8),
    "point",
  );
  assert.equal(gestureForSpokenText("Muy bien, lo lograste", 8), "celebrate");
  assert.equal(gestureForSpokenText("Piensa en otra solución", 6), "think");
  assert.equal(gestureForSpokenText("Por qué", 7), "think");
  assert.equal(gestureForSpokenText("No te preocupes", 15), "encourage");
});
test("unspoken cues cannot change the gesture and punctuation permits a pause", () => {
  assert.equal(gestureForSpokenText("Una variable. Muy bien", 3), undefined);
  assert.equal(gestureForSpokenText("Una variable.", 13), "rest");
});

test("a repeated keyword or a stalled speech boundary cannot freeze the gesture", () => {
  for (const speechText of [
    "Recuerda este concepto importante",
    "Piensa en una variable",
    "Muy bien, excelente",
  ]) {
    const gestures = new Set(
      Array.from({ length: 30 }, (_, elapsed) =>
        selectGesture({
          selection: "auto",
          elapsed,
          speaking: true,
          listening: false,
          speechText,
          spokenEnd: speechText.length,
          pose: "explaining",
        }),
      ),
    );
    assert.ok(gestures.size >= 4, `Gesture froze for ${speechText}`);
  }
});
