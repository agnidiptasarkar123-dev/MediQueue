---
name: MediQueue Premium Healthcare
colors:
  surface: '#ffffff'
  surface-dim: '#f8fafc'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8fafc'
  surface-container: '#f1f5f9'
  surface-container-high: '#e2e8f0'
  surface-container-highest: '#cbd5e1'
  on-surface: '#0f172a'
  on-surface-variant: '#475569'
  inverse-surface: '#0f172a'
  inverse-on-surface: '#f8fafc'
  outline: '#cbd5e1'
  outline-variant: '#e2e8f0'
  surface-tint: '#0f172a'
  primary: '#0f172a'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#f8fafc'
  inverse-primary: '#94a3b8'
  secondary: '#1e293b'
  on-secondary: '#ffffff'
  secondary-container: '#334155'
  on-secondary-container: '#f1f5f9'
  tertiary: '#0284c7'
  on-tertiary: '#ffffff'
  tertiary-container: '#e0f2fe'
  on-tertiary-container: '#0369a1'
  error: '#dc2626'
  on-error: '#ffffff'
  error-container: '#fef2f2'
  on-error-container: '#991b1b'
  success: '#16a34a'
  on-success: '#ffffff'
  success-container: '#f0fdf4'
  on-success-container: '#166534'
  warning: '#d97706'
  on-warning: '#ffffff'
  warning-container: '#fffbeb'
  on-warning-container: '#92400e'
  background: '#f8fafc'
  on-background: '#0f172a'
  surface-variant: '#f1f5f9'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1200px
---

## Brand & Style

MediQueue is a modern healthcare SaaS. The visual goals are trustworthy, clean, premium, calm, clear, fast, and professional. The emotional response should be one of "trust + clarity + speed."

## Colors

- **Canvas White (#F8FAFC):** Primary background surface, providing a calm, clinical, yet warm atmosphere.
- **Deep Navy/Blue Primary (#0F172A):** Used for primary text, major structural elements, and high-contrast primary actions.
- **Subtle Green Success (#16A34A):** Used for positive states, completed actions, and live indicators.
- **Amber Warning (#D97706):** Used for pending states, skipped patients, or bottlenecks.
- **Urgent Red (#DC2626):** Strictly reserved for urgent priorities (e.g., EMERGENCY), no-shows, and errors.

## Typography

- **Plus Jakarta Sans** for headlines and display text, giving a friendly but highly professional geometric feel.
- **Inter** for body copy and data tables to ensure maximum legibility and speed of reading.
- Large, readable typography is prioritized over dense packing.

## Layout & Spacing

- Generous spacing around all elements. The interface must never feel cluttered.
- Rounded cards (`1rem` or `1.5rem`) for main content containers to create a soft, approachable feel.
- Minimal shadows. Use subtle 1px borders (`outline-variant`) or very diffused, faint shadows (`rgba(15, 23, 42, 0.05)`) to lift cards.

## Components

- **Buttons:** Solid Deep Navy for primary actions. Pill-shaped (`rounded-full`) or generously rounded (`rounded-lg`). Hover states should slightly dim the background rather than adding glowing shadows.
- **Cards:** White surfaces (`#ffffff`) resting on an off-white background (`#F8FAFC`). Soft rounding, thin borders, no harsh drop shadows.
- **Status Pills:** Soft backgrounds (e.g., `success-container` #F0FDF4) with darker contrasting text (e.g., `on-success-container` #166534). Always pill-shaped.
- **Icons:** Professional, crisp outline icons. Never cartoonish.

## Anti-Patterns (BANNED)

- No Bootstrap-looking generic dashboards.
- No neon AI UI, glowing gradients, or gaming-style aesthetics.
- No excessive glassmorphism.
- No clutter or cramped spacing.
- No unnecessary bounce or spring animations. Interactions should feel fast and deliberate.
