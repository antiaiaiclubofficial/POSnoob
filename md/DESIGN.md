---
name: Liquid Glass Pet POS
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F3F3F3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#45464E'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#76767f'
  outline-variant: '#c6c5cf'
  surface-tint: '#525c87'
  primary: '#020d35'
  on-primary: '#ffffff'
  primary-container: '#18234a'
  on-primary-container: '#808bb8'
  inverse-primary: '#bac4f5'
  secondary: '#5c5b7d'
  on-secondary: '#ffffff'
  secondary-container: '#d9d6fe'
  on-secondary-container: '#5d5c7e'
  tertiary: '#0f1200'
  on-tertiary: '#ffffff'
  tertiary-container: '#232800'
  on-tertiary-container: '#859500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#bac4f5'
  on-primary-fixed: '#0d193f'
  on-primary-fixed-variant: '#3a456e'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c5c3ea'
  on-secondary-fixed: '#191836'
  on-secondary-fixed-variant: '#454364'
  tertiary-fixed: '#daed5b'
  tertiary-fixed-dim: '#bed041'
  on-tertiary-fixed: '#1a1e00'
  on-tertiary-fixed-variant: '#434b00'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  primary-gradient-end: '#020D35'
  accent-red: '#8E171D'
  accent-brown: '#C5805D'
typography:
  display-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gap-xs: 0.5rem
  gap-sm: 1rem
  gap-md: 2rem
  margin-page: 3rem
  card-padding: 2rem
---

# Design System Strategy: Liquid Glass Pet POS

## 1. Overview & Creative North Star
**Creative North Star: "The Tactile Sanctuary"**

This design system transcends the standard "utility dashboard" by treating the interface as a physical, premium space. We are moving away from the rigid, boxy constraints of traditional POS software toward a "Liquid Glass" aesthetic. The goal is to make the management of a pet salon feel as fluid and high-end as the services provided. 

We break the "template" look through **Organic Layering** and **Intentional Asymmetry**. By utilizing extreme corner radii (`xl: 3rem`) and overlapping translucent surfaces, we create a UI that feels "grown" rather than "built." Data is not just displayed; it is hosted within breathable, frosted vessels that prioritize calm and clarity over information density.

---

## 2. Colors & Surface Philosophy
The palette balances the authority of `primary: #18234A` (Navy) with the high-energy "spark" of `tertiary_fixed: #EAFD69` (Lime).

### The "No-Line" Rule
**Strict Mandate:** Prohibit the use of 1px solid borders for sectioning. Boundaries must be defined solely through:
1.  **Tonal Shifts:** Placing a `surface_container_low` element against a `surface` background.
2.  **Shadow Depth:** Using diffused ambient shadows to imply separation.
3.  **Backdrop Blurs:** Using glassmorphism to create a natural "edge" through refraction rather than a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked sheets of frosted glass.
*   **Level 0 (Base):** `surface` (#f9f9f9). The canvas.
*   **Level 1 (Sections):** `surface_container_low` (#f3f3f3). Large layout areas.
*   **Level 2 (Cards):** `surface_container_lowest` (#ffffff). Individual interactive units.
*   **Level 3 (Pop-overs):** Glassmorphism (Semi-transparent `surface_container_lowest` + 20px Backdrop Blur).

### Signature Textures: The "Liquid" Gradient
To inject "soul" into the POS, main CTAs and hero data points should use a subtle linear gradient:
*   **Primary Action:** From `primary_container` (#18234a) to `primary` (#020d35) at a 135-degree angle.
*   **Pet Highlight:** A soft glow using `tertiary_fixed` (#EAFD69) at 10% opacity behind pet avatars to create a "halo" effect.

---

## 3. Typography
We use a high-contrast scale to ensure the editorial "High-End" feel.

*   **Display & Headlines (Plus Jakarta Sans):** These are our "Brand Voices." Use `display-md` for daily revenue or total pets. The generous tracking and organic curves of Plus Jakarta Sans soften the technical nature of the POS.
*   **Body & Labels (Inter):** These are our "Functional Voices." Inter provides maximum readability for pet medical notes, appointment times, and SKU numbers. 

**Hierarchy Strategy:** 
Always pair a `headline-sm` in `primary` color with a `label-md` in `on_surface_variant` (#45464e) to create an immediate, digestible hierarchy that feels curated rather than cluttered.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by "stacking" tonal tiers. An appointment card (`surface_container_lowest`) sitting on a sidebar (`surface_container_low`) creates a natural lift. 

### Ambient Shadows
For floating elements like "Check-in" modals:
*   **Color:** Use a tinted shadow based on `primary` (#18234A) at 4% alpha. 
*   **Blur:** High diffusion (Y: 20px, Blur: 40px). 
*   **Avoid:** Never use pure #000000 for shadows; it "muddies" the liquid glass effect.

### Glassmorphism & Depth
Apply `backdrop-filter: blur(20px)` to secondary navigation or top bars. Use `surface_container_lowest` at 70% opacity. This allows the vibrant pet photography and data visualizations to "bleed" through the UI, softening the overall experience.

---

## 5. Components

### Buttons
*   **Primary:** `xl` roundedness. Gradient fill (Navy). Text in `on_primary`. High-glaze finish (subtle inner-top white highlight 10% opacity).
*   **Secondary (Lime Spark):** Use `tertiary_fixed` (#EAFD69) for "New Appointment" buttons. It is the most visible element on the screen.
*   **Ghost:** No background. `label-md` in `primary`. Only used for low-priority actions like "Cancel."

### Cards (The "Glass Vessel")
*   **Radius:** Always use `xl` (3rem) for main dashboard cards and `lg` (2rem) for nested items.
*   **Padding:** Use `spacing.6` (2rem) to allow the content to breathe. 
*   **Separation:** Forbid dividers. Use `spacing.4` vertical gaps or a `surface_variant` background shift to denote new sections.

### Pet-Specific Components
*   **Status Bubbles:** Soft, pill-shaped (`full` roundedness) indicators for "In Grooming" or "Ready for Pickup" using `secondary_container` (#d9d6fe).
*   **Vibrant Data Viz:** Use `accent` colors (#8E171D, #C5805D) for health alerts or specialty service tracking. Ensure charts use "smooth" interpolation (Bezier curves) to match the liquid theme.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a structural element. If a screen feels busy, increase the spacing from `4` to `6`.
*   **DO** use high-quality pet imagery with background removal to let them "float" over the glass cards.
*   **DO** use `tertiary_fixed` (Lime) sparingly as a "look at me" trigger for conversion or alerts.

### Don't
*   **DON'T** use 1px solid lines to separate list items. Use a `0.5px` `outline_variant` at 15% opacity if a visual guide is absolutely necessary.
*   **DON'T** use sharp corners (`none` or `sm`). Everything in this salon is soft, safe, and premium.
*   **DON'T** use high-contrast dark mode backgrounds. Keep the "Liquid" feel by staying within the `surface` to `surface_container_highest` range.