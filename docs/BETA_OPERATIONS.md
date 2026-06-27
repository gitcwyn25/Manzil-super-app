# Manzil Beta Operations

## Launch category focus

Start with dense coverage in:

1. Restaurants
2. Cafes
3. Beauty or repairs, only after the first two categories have useful density

## Seed listing workflow

1. Collect listing rows using `data/tashkent-seed-template.csv`.
2. Validate required headers with `npm run seed:validate`.
3. Import rows into PostgreSQL after Prisma repository wiring is complete.
4. Mark imported businesses as `unclaimed`.
5. Prioritize outreach to listings with photos, phone numbers, and central Tashkent locations.

## Outreach workflow

1. Show the business its pre-created profile.
2. Offer free claim and founding business badge.
3. Verify phone or route to manual admin approval.
4. Ask for business photos and accurate opening hours.
5. Ask each successful claimant for 2-3 warm business referrals.

## Beta reviewer workflow

1. Invite TSUE/personal-network users.
2. Ask for real reviews only.
3. Reward with visible founding reviewer badge.
4. Avoid cash rewards to reduce fake-review incentives.

## Launch gate

Do not start public PR or paid acquisition until:

- 500+ seeded listings exist.
- 100-200 businesses have been contacted.
- 2-3 categories have visible density.
- Search-to-profile-view analytics are active.
- Admin moderation can handle claims and flagged content.
