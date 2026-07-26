# Consumer Android Screen Map

This is the first working inventory for the Manzil Android consumer platform.

## Priority 1

### Home

Purpose: give users an immediate reason to explore.

Core content:
- Location-aware search entry.
- Nearby recommendations.
- Trending categories.
- Saved or recent places.
- AI concierge prompt.

### Search

Purpose: help users find a specific place or category quickly.

Core content:
- Search input with query suggestions.
- Filter chips for category, open now, rating, distance, price, halal, family-friendly.
- List/map switch.
- Sort by relevance, distance, rating, newest.

### Business Detail

Purpose: answer "Should I go here?" without making the user hunt.

Core content:
- Photos.
- Name, category, rating, review count, verification.
- Open status, hours, distance, address.
- Actions: call, directions, save, share, review.
- AI review summary.
- Reviews and similar places.

### Review Flow

Purpose: collect useful, trustworthy local feedback.

Core content:
- Star rating.
- Visit context.
- Review text.
- Photo upload.
- Helpful tags.
- Clear submission confirmation.

### Profile and Saved

Purpose: make Manzil feel personal and useful over time.

Core content:
- Saved businesses and lists.
- Review history.
- Language preferences.
- Notification preferences.
- Account/auth state.

## Priority 2

### Concierge

Purpose: turn vague intent into useful local recommendations.

Example prompts:
- "Find a quiet cafe near me for a meeting."
- "Where can I take family tonight?"
- "Best plov near me that is open now."

### Lists

Purpose: support trip planning and repeat discovery.

Examples:
- Weekend in Tashkent.
- Best cafes for work.
- Family restaurants.
- Saved for later.

### Notifications

Purpose: keep users informed without becoming noisy.

Examples:
- Saved place changed hours.
- Reply to user's review.
- New recommendation near current location.

## Required States

- First run / onboarding.
- Location permission allowed, denied, and approximate-only.
- Empty search results.
- Offline or slow network.
- Guest user.
- Signed-in user.
- Business missing data.
- Review pending moderation.

## Navigation Proposal

Phone tabs:
- Home
- Search
- Concierge
- Saved
- Profile

Larger screens:
- Replace bottom tabs with navigation rail.
- Use list-detail layouts for search results and business detail.
- Keep filters visible as a side panel when width allows.
