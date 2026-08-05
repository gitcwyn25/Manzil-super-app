---
name: Vibrant Marketplace
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#414755'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#994100'
  on-tertiary: '#ffffff'
  tertiary-container: '#c05400'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  margin-mobile: 16px
  margin-desktop: 32px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for a high-energy local commerce platform that bridges the gap between professional reliability and the excitement of discovery. The personality is proactive, trustworthy, and efficient. 

The aesthetic leverages **Modern Corporate** foundations with **Tactile** enhancements. It uses generous white space to prevent information density from becoming overwhelming, ensuring that high-value deals are the focal point. Visual interest is generated through depth—using soft shadows and subtle layering to make actionable elements feel physically pressable and responsive. The interface prioritizes clarity to build user confidence during financial transactions, while using vibrant accents to inject a sense of urgency and reward.

## Colors

This design system utilizes a high-contrast palette designed to guide the user's eye through a conversion funnel:

- **Primary (Electric Blue):** Used for core navigational elements, primary action buttons, and active states. It signals technology and reliability.
- **Secondary (Success Green):** Specifically reserved for "Savings," "Price Drops," and "Confirmed" states. It provides a positive psychological reinforcement of value.
- **Tertiary (Urgent Orange):** Used sparingly for limited-time offers, countdowns, and "Low Stock" indicators to drive immediate action.
- **Neutral (Slate Gray):** A sophisticated grayscale used for secondary text, borders, and background layering to maintain a professional, clean environment.
- **Background:** A crisp white (#FFFFFF) is the primary surface, with a very light cool gray (#F8FAFC) used for section nesting and card backgrounds to maintain separation.

## Typography

The typography system uses **Hanken Grotesk** across all levels to maintain a contemporary, sharp, and highly legible appearance. 

- **Headlines:** Use heavy weights (700-800) with slight negative letter-spacing to create a strong visual impact for deal titles and section headers.
- **Body Text:** Maintains a standard 16px base for optimal readability on mobile devices.
- **Labels:** Used for metadata like "Distance," "Category," and "Time Left." These often use a medium or semi-bold weight to remain distinct from body descriptions at smaller sizes.
- **Numerical Data:** Price points should always be rendered in `headline-md` or `headline-lg` to ensure the value proposition is immediately visible.

## Layout & Spacing

The design system employs a **Fluid-Fixed Hybrid Grid**. 
- **Mobile:** A 4-column grid with 16px margins. Content cards typically span the full width.
- **Desktop:** A 12-column centered grid with a maximum content width of 1280px. 
- **Vertical Rhythm:** Spacing follows a 4px baseline, with 16px (stack-md) being the standard gap between related elements and 32px (stack-lg) separating distinct content sections.

Card layouts should utilize internal padding of 16px or 20px to ensure content does not feel cramped against the rounded edges.

## Elevation & Depth

Depth is used to signify interactivity and priority. This design system avoids flat design in favor of **Soft Tactility**:

- **Level 0 (Base):** The primary background, flat and neutral.
- **Level 1 (Cards):** Low-offset shadows (4px Y-axis, 12px Blur, 4% Black) are used for standard deal cards to make them pop slightly from the background.
- **Level 2 (Active/Hover):** Increased shadow spread (8px Y-axis, 20px Blur, 8% Black) for items being hovered or selected.
- **Level 3 (Modals/Overlays):** Deep, diffused shadows with a subtle tint of the primary color to create a focused, immersive experience.

Backdrop blurs (12px) are used behind fixed headers and navigation bars to maintain context while the user scrolls.

## Shapes

The shape language is defined by **Soft/Rounded Geometry**. 
- **Cards & Container Elements:** Use `rounded-lg` (16px) to create a friendly, modern container that feels safe and approachable.
- **Buttons:** Use `rounded-lg` or full `rounded-pill` for primary call-to-actions to maximize touch-target perception.
- **Input Fields:** Use `rounded-md` (8px) to maintain a slightly more structured look for data entry.
- **Icons:** Line-based icons should have a 2px stroke width with rounded caps and joins to match the curvature of the UI components.

## Components

- **Action Buttons:** Primary buttons feature a subtle gradient of the Primary Blue and a soft drop shadow. Secondary buttons use a ghost style with a 1.5px border.
- **Deal Cards:** The "Master Card" component includes a top-aligned image with a 16px corner radius, a floating "Savings Badge" in the top-right (Secondary Green), and a bottom section for title, rating, and price.
- **Badges/Chips:** Used for categories and tags. These should have a low-opacity background tint of the color they represent (e.g., 10% opacity Orange for "Expiring Soon").
- **Inputs:** Text fields feature a light gray border that transitions to the Primary Blue on focus, accompanied by a soft glow effect.
- **Lists:** Used for account settings and location selections, featuring high-contrast icons and chevron indicators for clear navigation.
- **Success States:** Use a prominent "Checkmark" icon inside a secondary green circle, accompanied by tactile haptic feedback (if on mobile).