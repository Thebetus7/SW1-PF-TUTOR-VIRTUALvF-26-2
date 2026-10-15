---
name: skylearn
description: Sistema de diseño Skylearn para plataformas EdTech K-8 y productos de tutoría infantil amigable, con paleta accesible, tipografía dislexia-friendly y componentes UI ergonómicos.
---

# Skylearn Design System

## Overview
Skylearn is a design system for kids' edtech platforms, K-8 learning apps, and family-friendly tutoring products. The aesthetic is warmly bright — a friendly sky blue anchors the brand, sun yellow signals achievements and rewards, and leaf green marks progress and correct answers. Surfaces are generous and white; corners are softly rounded; type is large and dyslexia-friendly. The system targets two simultaneous user groups: children (ages 5-14) who need large tap targets, clear visual rewards, and copy that doesn't condescend, and the parents or teachers behind the kids' shoulder who need to assess progress quickly and trust the platform. Skylearn rejects two failure modes common in kids' UI: the saccharine pastel-cartoon aesthetic that feels childish and the corporate-edtech sterility that feels like a test-prep workbook. Instead it aims for the warmth of a great public library children's room.

---

## Colors & Design Tokens

### Primary Palette
- **Sky** (`#3B82F6`): Primary brand color — primary CTAs, navigation, active states.
- **Sky Bright** (`#60A5FA`): Hover states, soft accents.
- **Sky Deep** (`#1D4ED8`): Pressed states, focused-input borders.
- **Sky Soft** (`#DBEAFE`): Background tints for active items, lesson selection.

### Feedback & Accent Palette
- **Sun** (`#FBBF24`): Achievement accent — stars, badges, rewards, streaks.
- **Sun Bright** (`#FCD34D`): Achievement glow and celebration states.
- **Sun Deep** (`#D97706`): Hover state on sun-yellow elements.
- **Leaf** (`#22C55E`): Progress and correct-answer accent.
- **Leaf Soft** (`#DCFCE7`): Background tint for correct-answer feedback.
- **Leaf Deep** (`#16A34A`): Strong correct-answer indicator.
- **Coral** (`#F87171`): Gentle error indicator — *"not quite, try again"* — never punitive red.
- **Coral Soft** (`#FEE2E2`): Background tint for *"let's try again"* feedback.
- **Berry** (`#A855F7`): Secondary accent — bonus content, *"go further"* prompts.

### Surfaces & Neutrals
- **Background** (`#FFFFFF`): Pure white page background.
- **Surface** (`#F8FAFC`): Card and panel surface, very subtle cool tint.
- **Surface Elevated** (`#FFFFFF`): Modals, focused content.
- **Surface Sunken** (`#F1F5F9`): Inset wells, "drag here" zones.

### Typography & Lines
- **Ink** (`#0F172A`): Primary text — deep navy near-black, soft on the eyes.
- **Ink Muted** (`#475569`): Secondary text, instructions.
- **Ink Subtle** (`#94A3B8`): Metadata, timestamps.
- **Ink Faint** (`#CBD5E1`): Disabled state, placeholder.
- **Outline** (`#E2E8F0`): Card edges, dividers.
- **Outline Strong** (`#94A3B8`): Focus rings, prominent separators.

---

## Typography

- **Display**: Hubot Sans (fallback: Nunito, Quicksand) — used for headlines and feature titles, with rounded terminals.
- **Body Sans**: Atkinson Hyperlegible (fallback: Nunito Sans, Inter) — used for instructions, body, UI; specifically chosen for dyslexia-friendly letterforms.
- **Reading Serif**: Lexend Deca (fallback: Source Serif) — optional alternative for reading-comprehension passages.
- **Mono**: JetBrains Mono — used for math equations, timers, scores.

### Accessibility in Typography
The defining choice is using **Atkinson Hyperlegible** — a typeface explicitly designed for low-vision and dyslexia accessibility — for body and instruction copy. Its distinctive letterforms (open apertures, distinct b/d/p/q, weighted bottoms) reduce visual confusion for emerging readers. Headlines use Hubot Sans with rounded terminals for friendly warmth without becoming cartoonish. Letterforms are at least 16px throughout the entire system; instruction copy is 18px minimum. Letter-spacing on body is set slightly looser than default (`0.01em`) to reduce crowding for young readers.

### Type Scale
- **Hero**: `56px / 60px` (display 700)
- **H1**: `40px / 48px` (display 700)
- **H2**: `32px / 40px` (display 700)
- **H3**: `24px / 32px` (display 600)
- **H4**: `19px / 28px` (body 600)
- **Body Large**: `20px / 32px` (body — for instructions to kids)
- **Body**: `18px / 28px` (body — for parent-facing copy)
- **Small**: `16px / 24px` (body)
- **Caption**: `14px / 20px` (body)
- **Score Number**: `56px / 56px` (display 700 tabular)

---

## Elevation & Radii

Skylearn uses soft, friendly elevation:
- **Cards**: Rest on the page with a 1px outline border (`#E2E8F0`) and lift on hover with a soft shadow (`0 8px 24px rgba(15, 23, 42, 0.06)`).
- **Active Lesson Cards**: Get a 3px sky border with a sky-soft tinted shadow (`0 12px 32px rgba(59, 130, 246, 0.15)`).
- **Reward Badges**: Glow sun-bright (`0 0 24px rgba(252, 211, 77, 0.4)`) when first earned, fading after 2 seconds.
- **Modals**: Use a larger shadow (`0 24px 48px rgba(15, 23, 42, 0.12)`) and a backdrop wash with subtle blur.

### Border Radii
- `8px`: Inputs, small chips.
- `12px`: Standard inputs, dropdowns.
- `16px`: Buttons (pill-friendly), answer tiles.
- `20px`: Lesson cards, speech bubble popovers.
- `28px`: Modals and large dashboard panels.
- `999px`: Avatar circles, star badges, tag pills, progress bars, and "got it!" confirmation pills.

---

## Core Components

1. **Lesson Card**:
   - Surface card with a 20px radius.
   - Illustrated icon at top (64px).
   - Lesson title in display serif 22px with single-line description.
   - Progress strip: 8px tall, 999px radius, leaf fill on sky-soft track.
   - Locked state: sun-yellow lock icon and reduced opacity.
   - Hover: subtle 240ms lift.

2. **Big Friendly Button**:
   - Primary CTA optimized for small hands: 64px tall minimum, 16px radius.
   - Sky fill with white text, body 600 weight at 20px, 24x40px padding.
   - Hover deepens to sky-deep with a 1px sky-bright bottom edge for a tactile "depressed" feel.
   - Active: scales to 0.97 with 120ms snap.

3. **Answer Tile**:
   - Multiple-choice questions: large 96px-tall tile with 16px radius, surface background, outline border. Hover lifts with sky shadow.
   - Correct state: leaf border + leaf-soft fill + checkmark badge in corner.
   - Incorrect state: gentle coral border + coral-soft fill (no harsh red) with a "let's try again" message.
   - Always provides a "Show me why" link to the explanation.

4. **Star Badge**:
   - 64px sun-filled circle with a star icon.
   - Pulses sun-bright glow on first earn.
   - Stacks of three (bronze, silver, gold) appear on completed lessons — gold for perfect runs.

5. **Streak Counter**:
   - Small flame icon (sun fill) with the streak number in display serif tabular.
   - Positioned in top navigation, growing visually as the streak gets longer.

6. **Progress Bar**:
   - 8px tall, 999px radius, sky-soft track with leaf fill.
   - Animated fill over 480ms ease-out when progress increments.
   - Major milestone fills trigger a brief sun-bright sparkle particle effect.

7. **Confetti Celebration**:
   - 1.6-second burst of confetti in sky, sun, leaf, and berry colors falling from the top of the viewport.
   - Reserved strictly for lesson/module completion — never for routine correct answers.

8. **Drag-and-Drop Zone**:
   - Surface-sunken area with a 2px dashed outline-strong border and a center "drag answers here" prompt.
   - Active drag state changes border to sky and background to sky-soft.

9. **Reading Passage**:
   - Layout with 19px body in Atkinson Hyperlegible, generous 32px leading.
   - Optional reading-ruler overlay (translucent sky bar highlighting current line).
   - "Read to me" speaker button in sky fill.

10. **Avatar / Character**:
    - Circular kid avatars at 56-96px sizes, with a 3px white inner ring and a 2px sky outer ring.
    - Mascot characters appear in lesson illustrations and hints.

11. **Parent / Teacher View Switcher**:
    - Subtle toggle in the corner switching between kid mode (large UI, illustrated) and parent/teacher mode (denser data, progress charts, time-spent breakdown).
    - Parent mode uses tighter typography and mono data displays.

12. **Quiz Score Card**:
    - Large 56px tabular score number in display.
    - Star row showing performance (1-3 stars).
    - "What you got right" leaf section.
    - "What we'll review next time" gentle coral section.
    - Always ends with a leaf "Keep going!" CTA.

13. **Help Bubble**:
    - Speech-bubble-shaped popover with 20px radius and a small tail.
    - Used when the platform's mascot offers a hint (background sky-soft with sky text).

14. **Tag Pills**:
    - 999px pills with body caption text.
    - Subject tags (Math, Reading, Science) use sky-soft fill with sky text.
    - Difficulty tags (Easy, Medium, Hard) use sun-soft, sun, and berry-soft respectively.

15. **Inputs**:
    - 1px outline border, surface background, 12px radius, 16x20px padding, 18px body text.
    - Focus border becomes sky with a 4px sky-soft ring.
    - Error states use coral border with a friendly inline message, never blocking the input.

---

## Spacing & Ergonomics

- **Base unit**: 4px.
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px.
- **Container max-width**: 1280px with 24px horizontal padding (desktop); 20px on mobile.
- **Tap target minimum**: 56px square (accommodates smaller hands and less fine motor control).
- **Card grid gap**: 20px mobile, 32px desktop.
- **Section spacing**: 48px between major sections for clearer visual chunking.

---

## Motion & Micro-interactions

- Standard duration: 240ms with `cubic-bezier(0.34, 1.56, 0.64, 1)` easing (gentle spring overshoot).
- Correct-answer feedback: 320ms leaf burst with a small confetti sparkle (3-4 particles, never more).
- Incorrect answers: Shake the tile briefly (4px horizontal, 240ms, two cycles), avoiding harsh red flashes.
- Progress bars fill with ease-out over 480ms.
- Star badges scale-in from 0 to full size over 480ms with overshoot.
- Confetti completion celebrations: 1.6 seconds.
- Accessibility: Respects `prefers-reduced-motion` (confetti reduces to a single static star burst; transitions shorten to 120ms).

---

## Iconography

Custom illustrated icon set at 2px stroke with rounded line caps and joins. Vocabulary: book with open pages, pencil with sharpened tip, calculator, magnifying glass, light bulb, star, rocket, leaf, sun, raindrop, paint palette, alphabet block.
- 24px default in `ink-muted`.
- 32px in lesson cards.
- 48px in feature contexts.
- Active icons use `sky`.
- Achievement icons use `sun`.
- Hand-drawn-adjacent feel: slightly imperfect, never sterile.

---

## Accessibility Invariants

1. **High Contrast**: Targets WCAG-AAA (7:1) on body text and AA-large (4.5:1) on large display text.
2. **Dyslexia First**: Atkinson Hyperlegible is required for all body and instruction text.
3. **No Color Alone**: Every state (correct/incorrect) pairs color with an icon (checkmark/x), pattern, and copy.
4. **Motor Accessibility**: 56px minimum tap targets on all interactive elements.
5. **Auditory & Visual Aids**: "Read to me" voice button available on reading passages; reading-ruler line highlighter.
6. **High-Contrast & Reduced-Motion Modes**: Full fallback support for sensory and motor sensitivities.

---

## Voice and Tone

- **Friendly but not babyish**: *"Let's try again!"* not *"Oopsie wopsie!"*.
- **Curious and encouraging**: *"What do you notice about this number?"*.
- **Specific praise over generic**: *"You spelled 'because' right — that's a tricky one."* not *"Great job!"*.
- **Errors are framed as learning, never failure**: *"Not quite — try multiplying first,"* *"Let's look again."*.
- **Parent/Teacher copy is clear and direct**: *"Maya spent 18 minutes on multiplication today. She got 14 of 16 correct on the quiz."*.
- **Inviting empty states**: *"Nothing here yet — pick a lesson to start!"*.

---

## Do's and Don'ts

| Do | Don't |
| :--- | :--- |
| Do use **Atkinson Hyperlegible** for body text — dyslexia accessibility is non-negotiable. | Don't use harsh, punitive red for errors — gentle **coral** is intentional. |
| Do enforce **56px minimum tap targets** for all kid-facing controls. | Don't condescend in copy — *"Oopsie!"* and *"Yay!"* feel insincere; use specific feedback. |
| Do pair every correct/incorrect state with an icon, not just color. | Don't reduce text below **16px** anywhere in the kid-facing UI. |
| Do reserve confetti for full completion, not routine correct answers. | Don't rely on color alone to convey meaning. |
| Do use sun-yellow exclusively for achievements and rewards, never for primary actions. | Don't use cartoonish gradients, "fun" stickers, or excessive emoji. |
| Do support the "Read to me" audio option on every reading passage. | Don't autoplay sound — every audio element requires user intent. |
| Do support explicit tap affordances without gating controls behind hover-only states. | Don't gate critical controls behind hover-only interactions. |
