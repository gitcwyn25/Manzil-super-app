# Contributor Guide
## How to Pick Up and Build a Feature

This guide is for engineers (including open-source contributors) picking up individual features to build.

---

## Before You Start

1. **Read the relevant documentation:**
   - [PRD.md](./PRD.md) — product context and goals
   - [ARCHITECTURE.md](./ARCHITECTURE.md) — technical design
   - [FEATURES.md](./FEATURES.md) — Phase 2/3 feature map with dependencies

2. **Find your feature in [FEATURES.md](./FEATURES.md)** and check:
   - Is it in the right phase for when you're working on it?
   - What does it **Depend on**? Are those dependencies already done?
   - How much effort is it?
   - Any cautions or conflicts with existing decisions?

3. **If dependencies aren't done**, don't start yet — prioritize finishing those first, or pick a different feature.

---

## Feature Pickup Checklist

### Step 1: Create a branch
```bash
git checkout -b feature/your-feature-name
```

### Step 2: Understand what you're building
- Read the feature description in [FEATURES.md](./FEATURES.md)
- Identify the **schema changes** needed (new tables? new columns?)
- Identify the **API endpoints** to build
- Identify the **frontend components** if UI is involved
- Check if there are **background jobs** or integrations needed

### Step 3: Database schema (if needed)
- Edit [packages/db/schema.prisma](../packages/db/schema.prisma)
- Create a migration: `npm run db:migrate:dev -- --name feature_name`
- Test locally: `npm run db:push` and `npm run db:studio` to inspect

### Step 4: Backend API
- Create/modify the NestJS module in [apps/backend/src/](../apps/backend/src/)
- Add endpoints under `/api/v1/your-module/`
- Use the shared types from [packages/shared/](../packages/shared/)
- Write tests: [apps/backend/test/](../apps/backend/test/)

### Step 5: Frontend (if needed)
- Add pages/components to [apps/web/src/](../apps/web/src/)
- Use the generated API client from `@shared/api-client`
- Add i18n strings for Uzbek/Russian/English in [apps/web/src/i18n/](../apps/web/src/i18n/)
- Test locally: `npm run dev`

### Step 6: Mobile (if needed)
- Add screens/components to [apps/mobile/src/](../apps/mobile/src/)
- Reuse the same API client and types

### Step 7: Tests & documentation
- Write unit tests for your logic
- Add API documentation comments (auto-exported to [docs/API.md](./API.md))
- Update [docs/DATABASE.md](./DATABASE.md) if schema changed
- Update this guide if your feature has special setup steps

### Step 8: Submit a PR
```bash
git add .
git commit -m "feat: implement your feature name"
git push origin feature/your-feature-name
```

Create a PR on GitHub. CI will automatically:
- Lint & format check
- TypeScript type check
- Run tests
- Deploy preview to Vercel staging

---

## Example: Implement a Simple Feature (Community Lists)

### Feature: Community Lists (Phase 2, from FEATURES.md §C1)

**What you're building:**
- Users can create public lists of favorite businesses ("Best burgers in Tashkent")
- Users can add businesses to lists
- Users can follow/save lists

**Schema changes:**
```prisma
model List {
  id        String   @id @default(cuid())
  owner     User     @relation(fields: [ownerId], references: [id])
  ownerId   String
  title     String
  description String?
  isPublic  Boolean  @default(true)
  items     ListItem[]
  followers ListFollower[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ListItem {
  id         String   @id @default(cuid())
  list       List     @relation(fields: [listId], references: [id], onDelete: Cascade)
  listId     String
  business   Business @relation(fields: [businessId], references: [id])
  businessId String
  note       String?
  sortOrder  Int
  createdAt  DateTime @default(now())

  @@unique([listId, businessId])
}

model ListFollower {
  id     String @id @default(cuid())
  list   List   @relation(fields: [listId], references: [id], onDelete: Cascade)
  listId String
  user   User   @relation(fields: [userId], references: [id])
  userId String

  @@unique([listId, userId])
}
```

**API endpoints:**
```
POST   /api/v1/lists                    # Create list
GET    /api/v1/lists                    # List user's lists
GET    /api/v1/lists/:id                # Get list details
PATCH  /api/v1/lists/:id                # Update list
DELETE /api/v1/lists/:id                # Delete list
POST   /api/v1/lists/:id/items          # Add business to list
DELETE /api/v1/lists/:id/items/:itemId  # Remove business
POST   /api/v1/lists/:id/follow         # Follow list
DELETE /api/v1/lists/:id/follow         # Unfollow list
```

**Frontend pages:**
- `/lists` — user's lists
- `/lists/:id` — view list details, add/remove items
- `/lists/new` — create new list

**Testing:**
- Unit tests for CRUD logic
- Integration tests for ownership (verify user can only edit their own lists)
- API tests for endpoints

---

## Code Style

- **Language:** TypeScript (strict mode)
- **Linter:** ESLint (auto-run on commit)
- **Formatter:** Prettier (run before committing)
- **Naming:**
  - Tables/models: PascalCase (e.g., `Business`, `ReviewReply`)
  - API fields: camelCase (e.g., `businessId`, `createdAt`)
  - Files: kebab-case (e.g., `business.module.ts`)

---

## Common Patterns

### Fetching with locale support
```typescript
// Backend: return user's preferred locale
const business = await this.businessService.findOne(id, user.locale);

// Frontend: pass locale to API client
const business = await api.businesses.get(id, { locale: user.locale });
```

### Rate limiting
```typescript
// NestJS: use the RateLimit guard
@Post('/reviews')
@UseGuards(RateLimitGuard)
async createReview(@Body() body: CreateReviewDto) { ... }
```

### Background jobs
```typescript
// Enqueue a job
await this.jobQueue.add('process-photo', { photoId }, {
  delay: 1000,
  attempts: 3,
});

// Handle job
@Process('process-photo')
async handlePhotoProcessing(job: Job) {
  // resize, upload, etc.
}
```

---

## Getting Help

- **Questions about the product?** → Read [PRD.md](./PRD.md)
- **Questions about dependencies?** → Check [FEATURES.md](./FEATURES.md)
- **Questions about the stack?** → Read [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Schema questions?** → Run `npm run db:studio` to inspect the database visually
- **Stuck?** → Open an issue or ask in the team chat

---

**Happy coding! 🚀**
