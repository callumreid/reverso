## Retro-Future Disco Lab Spec (November 2025)

### Token System
- `src/app/globals.css` defines all palette, spacing, radius and shadow tokens. Use the CSS custom properties instead of hard-coded values. Examples: `var(--accent-primary)` (neon magenta), `var(--radius-pill)` (primary CTA pill), `var(--shadow-glow-magenta)` (orb/CTA glow).
- Fonts: `Space Grotesk` for display (`--font-reverso-display`) and `Inter` for UI copy (`--font-reverso-body`).
- Motion safety: toggled through the Settings switch. When active, `<html data-motion="reduced" />` disables non-essential animations.

### Layout & Shell
- `GameExperience` now renders the full console shell with radial background, angled beams, and the new top chrome (wordmark, round badge, settings button).
- `TimelineStrip` is reused across all screens. Pass `nodes` with status `inactive | current | completed`. Each node auto-renders the mirrored play/rewind/mic/spark icon.
- `ScreenFrame` handles mirrored headings, ghost text, and the “one big thing” content slot. Required props:
  - `metaLabel` (e.g., `Round 02 • Reversed`)
  - `title`, `subtitle`
  - Optional `ghostText`/`instructions`/`footer`

### Signature Components
- **Record Orb (`MicButton`)**: circular CTA with gradient skin, orbiting dots, and dashed twin ring. Accepts `label`, `isActive`, `disabled`. Pair with `useSpacebarToggle` for keyboard parity.
- **Waveform Console**: `WaveformConsole` accepts `label`, `samples`, optional `overlaySamples`, `palette`, `isActive`, `caption`. Used for live recording (magenta) and playback (cyan). Provides mirrored labels and layered bars.
- **PrimaryButton**: pill gradient CTA (or ghost variant) with keyboard focus ring. Use for “Send it to the future”, “Ready to mimic”, “Flip it forward”, and “Next round”.
- **ScoreDial / MetricChip**: hero dial plus trio of pills for Rhythm/Vowels/Consonants. `ScoreDial` expects a 0–100 number; `MetricChip` renders up to three neon bars.
- **PhraseDiffCard**: stacks Original vs “You said” with inline character highlighting. Pass the transcriptions; missing text renders as ellipsis.
- **AudioClipButton**: refreshed disco rows with play badge, mini progress shimmer, and optional `auxiliary` label (▶ / ∞).

### Screen Flow
1. **Say Your Phrase (`ScreenA`)**
   - Record orb + magenta waveform.
   - CTA disabled until reversal completes; `PrimaryButton` advances to Listen Backwards.
   - Instruction block reminds players not to over-enunciate.
2. **Listen Backwards (`ScreenB`)**
   - Cyan waveform console + control deck (Play/Pause, Auto loop).
   - `PrimaryButton` labelled “Ready to mimic”.
3. **Try To Say It Backwards (`ScreenC`)**
   - Record orb reused with magenta waveform.
   - CTA “Flip it forward” unlocks once reversal succeeds.
4. **Results (`ScreenD`)**
   - Left: clip stack (`AudioClipButton` list).
   - Right: `ScoreDial` + metric chips.
   - Bottom: `PhraseDiffCard` for transcript comparison.

### Motion & Micro-Interactions
- Global animations use `@keyframes ghost-drift`, `orbit`, `glitch`, and `pulse`.
- `TimelineStrip` nodes pulse when current; connectors animate via gradient fill.
- `MicButton` uses pulsing borders and orbiting dots; `PrimaryButton` scales to 1.02 on hover.
- Respect motion toggle: critical focus/feedback remains active, but ghost text drift, orbit dots, and glitch loops stop when `data-motion="reduced"`.

### Accessibility Notes
- All CTAs expose focus-visible rings.
- Settings switch uses `role="switch"` with `aria-checked`.
- Ghost/mirrored text carries `aria-hidden`.
- Timeline nodes convey order and completion through both glow and labels; pair with screen reader text if further expansion is needed.

