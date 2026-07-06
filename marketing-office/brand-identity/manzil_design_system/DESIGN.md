---
name: Manzil Design System
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#3e4948'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#6e7979'
  outline-variant: '#bec9c8'
  surface-tint: '#03696a'
  primary: '#005454'
  on-primary: '#ffffff'
  primary-container: '#0f6e6e'
  on-primary-container: '#9eedec'
  inverse-primary: '#85d4d3'
  secondary: '#7e5700'
  on-secondary: '#ffffff'
  secondary-container: '#feb300'
  on-secondary-container: '#6a4800'
  tertiary: '#823100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a84305'
  on-tertiary-container: '#ffd7c7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a1f0ef'
  primary-fixed-dim: '#85d4d3'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f50'
  secondary-fixed: '#ffdeac'
  secondary-fixed-dim: '#ffba38'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#604100'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style
The design system is built on the principle of "Modern Heritage." It bridges the gap between Uzbekistan’s rich architectural history and a forward-thinking digital future. The aesthetic is **Modern Corporate** with a focus on reliability and local resonance.

The personality is authoritative yet welcoming, positioning itself as the definitive guide for local discovery. We utilize a refined card-based layout with high-quality imagery to celebrate local businesses. The visual style avoids unnecessary decorative flourishes, opting instead for structural clarity, generous whitespace, and precise geometry to ensure the platform feels premium and trustworthy for both locals and tourists.

## Colors
The palette is anchored by **Deep Teal**, a color that evokes stability and the historic tilework of Samarkand and Bukhara, but rendered in a modern, saturated tone. 

- **Primary (Deep Teal):** Used for navigation, primary buttons, and brand iconography. It conveys professional trust.
- **Accent (Warm Gold):** Reserved for ratings (stars), verification badges, and high-priority call-to-actions. It provides a warm, sun-drenched contrast to the teal.
- **Surface:** The off-white background (#F9F9F7) prevents the "starkness" of pure white, offering a paper-like, premium feel that is easier on the eyes during long browsing sessions.
- **Semantic:** Use standardized reds for errors and greens for "Open Now" status indicators, ensuring these are distinct from the brand Teal.

## Typography
This design system utilizes a dual-font approach to balance technical precision with readability. Both fonts are selected for their excellent support of Cyrillic and Uzbek Latin glyphs.

- **Geist** is used for headings and UI labels. Its geometric, slightly condensed nature feels modern and "engineered," lending an air of efficiency to the platform.
- **Inter** is used for body copy, reviews, and descriptions. Its tall x-height and neutral character ensure high legibility even at smaller sizes on mobile devices.

When displaying currency (UZS) or phone numbers (+998), use **Geist Mono** if available or the Medium weight of Geist to ensure numerical data stands out clearly within listings.

## Layout & Spacing
The layout follows a **Fluid Grid** philosophy with mobile-first density. 

- **Mobile (Default):** 4-column grid with 20px outside margins. Content relies heavily on vertical stacking and horizontal "peek" scrolling for card collections (e.g., "Trending Near You").
- **Desktop:** 12-column grid with a maximum container width of 1200px. 
- **Spacing Rhythm:** We use a 4px baseline grid. Most components should use 16px (md) for internal padding to maintain a "generous" feel that differentiates the platform from cluttered legacy directories.

Localized content, particularly long Uzbek words in Latin script, requires flexible containers that allow for text wrapping without breaking the layout. Avoid fixed-width buttons where possible.

## Elevation & Depth
This design system uses **Tonal Layers** and **Ambient Shadows** to define hierarchy. 

1. **Base:** The background (#F9F9F7) is the lowest level.
2. **Cards:** Individual business listings or review cards sit on a pure white (#FFFFFF) surface with a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.04)).
3. **Overlays:** Modals and bottom sheets use a stronger elevation with a 16px blur backdrop filter to maintain context while focusing the user.

We avoid heavy borders; instead, we use 1px subtle strokes in a slightly darker neutral (#E5E5E0) only when cards are placed on white backgrounds to ensure boundary definition.

## Shapes
The shape language is **Rounded**, reflecting a modern and approachable brand. 

- Standard components (inputs, cards, small buttons) use a **0.5rem (8px)** radius.
- Large containers and featured image blocks use **1rem (16px)** to create a soft, friendly "frame" for photography.
- Interactive tags and status chips (e.g., "Halal," "Open Now") use **Pill-shaped** rounding to distinguish them from functional buttons.

## Components

### Buttons
- **Primary:** Deep Teal background, white text. 0.5rem rounding. Bold Geist labels.
- **Secondary:** Transparent background, Deep Teal 1.5px border.
- **High-Action (CTA):** Warm Gold background with dark text, used sparingly for "Book Now" or "Rate Business."

### Cards
Business cards are the core of the system. They must feature a 16:9 aspect ratio image at the top, followed by a title in Geist Medium, and a secondary row containing the rating (Gold star + numerical value) and the price range (e.g., "$$$" or "so'm").

### Lists & Inputs
Input fields should be clearly outlined with a 1px neutral border that turns Deep Teal on focus. Labels sit above the field in Geist Label-md. 

### Localized Elements
- **Currency Toggle:** A clean segment control to switch between UZS and USD.
- **Language Switcher:** Floating Action Button (FAB) or top-right nav item showing the current language flag and code (e.g., 🇺🇿 UZ).
- **Ratings:** Always include the total count of reviews in parentheses next to the star rating to build trust.