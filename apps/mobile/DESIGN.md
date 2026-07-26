# Design

## Identity

Manzil Android uses the existing Manzil brand system: deep teal for primary action and navigation, warm gold for ratings and selective highlights, and off-white surfaces with white content cards.

## Color Tokens

- `ink`: `#1A1C1B`
- `muted`: `#3E4948`
- `subtle`: `#6E7979`
- `background`: `#F9F9F7`
- `surface`: `#FFFFFF`
- `surfaceSoft`: `#F4F4F2`
- `surfaceHigh`: `#E8E8E6`
- `primary`: `#005454`
- `primarySoft`: `#A1F0EF`
- `primaryDark`: `#002020`
- `gold`: `#FEB300`
- `goldSoft`: `#FFDEAC`
- `danger`: `#BA1A1A`
- `success`: `#0F6E4B`

## Typography

Use the native system font stack for Android reliability. Headings are bold but compact. Product labels avoid display styling and stay readable in dense surfaces.

## Shape

- Cards: 16px radius maximum.
- Inputs and buttons: 12px radius.
- Chips and status pills: full pill radius.

## Layout

Phone-first. Use 20px page padding, 12-16px component padding, and vertical rhythm based on 4px increments. Business cards use stable media blocks and do not shift when ratings, badges, or long districts wrap.

## Components

- Business cards show image placeholder, name, district, rating, review count, price, badges, and open status.
- Search uses large input, filter chips, and a list/map mode toggle.
- Business detail leads with decision-critical facts: rating, hours, call/directions/save/review, AI summary, and real reviews.
- Concierge behaves like a helper panel, not the main app shell.
- Empty states provide next action rather than only saying content is missing.
