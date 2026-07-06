# API Reference

## Manzil Super-app REST API v1

Production base URL:

```text
https://api.manzil.app/api/v1
```

Local development URL:

```text
http://localhost:3001/api/v1
```

## Authentication

Authenticated endpoints use Clerk bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.manzil.app/api/v1/businesses/123/reviews
```

## Auth

### `POST /auth/login`

Verifies a Clerk token and returns an application session payload.

Request:

```json
{ "token": "clerk-jwt-token" }
```

Response:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "CONSUMER"
  }
}
```

### `GET /auth/me`

Returns the current authenticated user.

Auth required.

## Businesses

### `GET /businesses`

Lists businesses with optional filters.

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `category` | string | Category ID |
| `latitude` | number | Latitude for geo filtering |
| `longitude` | number | Longitude for geo filtering |
| `radius` | number | Search radius in kilometers, default `5` |
| `minRating` | number | Minimum star rating |
| `locale` | string | Response locale, default `uz` |
| `page` | number | Page number |
| `limit` | number | Page size, default `20` |

Response:

```json
{
  "data": [
    {
      "id": "business-123",
      "name": "Restaurant Name",
      "category": { "id": "cat-1", "name": "Restaurants" },
      "rating": 4.5,
      "reviewCount": 128,
      "address": "123 Main St",
      "latitude": 41.2995,
      "longitude": 69.1971,
      "status": "CLAIMED"
    }
  ],
  "total": 250,
  "page": 1,
  "limit": 20
}
```

### `GET /businesses/:id`

Returns a full business profile with reviews, photos, and badges.

### `POST /businesses`

Creates a business.

Auth required.

Request:

```json
{
  "name": "My Cafe",
  "categoryId": "cat-1",
  "description": "A neighborhood cafe.",
  "address": "123 Main St",
  "latitude": 41.2995,
  "longitude": 69.1971,
  "phone": "+998 (99) 123-4567",
  "hours": { "monday": "10:00-22:00" },
  "priceTier": "MODERATE"
}
```

### `PATCH /businesses/:id`

Updates a business.

Auth required for the business owner or an admin.

### `POST /businesses/:id/claim`

Submits a business ownership claim.

Auth required.

Request:

```json
{ "verificationMethod": "PHONE" }
```

## Reviews

### `GET /businesses/:businessId/reviews`

Lists reviews for a business.

Query parameters include `sortBy`, `filterBy`, `page`, and `limit`.

### `POST /businesses/:businessId/reviews`

Creates a review.

Auth required.

Request:

```json
{
  "rating": 4,
  "text": "Great atmosphere and friendly staff.",
  "photoUrls": ["https://r2.manzil.app/photo.jpg"]
}
```

### `PATCH /reviews/:id`

Updates a review. Only the author can update it.

### `DELETE /reviews/:id`

Deletes a review. Only the author can delete it.

### `POST /reviews/:id/replies`

Adds a business-owner reply to a review.

### `POST /reviews/:id/report`

Reports a review as spam or inappropriate.

## Search

### `GET /search`

Searches businesses using full-text search.

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Required search query |
| `category` | string | Optional category filter |
| `latitude` | number | Optional geo-sort latitude |
| `longitude` | number | Optional geo-sort longitude |
| `locale` | string | Response locale, default `uz` |
| `limit` | number | Max results, default `20` |

## Categories

### `GET /categories`

Returns the category tree with localized names.

Response:

```json
{
  "data": [
    {
      "id": "cat-1",
      "name": {
        "uz": "Restoranlar",
        "ru": "Рестораны",
        "en": "Restaurants"
      },
      "icon": "restaurant",
      "children": []
    }
  ]
}
```

## Admin

### `GET /admin/claims/pending`

Lists pending business ownership claims.

Admin auth required.

### `POST /admin/claims/:id/approve`

Approves a business ownership claim.

Admin auth required.

### `GET /admin/moderation-queue`

Lists flagged reviews and photos.

Admin auth required.

## Error Responses

Errors follow this shape:

```json
{
  "statusCode": 400,
  "message": "Bad request",
  "error": "VALIDATION_ERROR"
}
```

Common status codes:

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Bad request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not found |
| `409` | Conflict |
| `429` | Too many requests |
| `500` | Server error |

## Rate Limiting

Write endpoints are rate limited.

Recommended defaults:

- Consumer endpoints: 100 requests per 15 minutes.
- Business owner endpoints: 300 requests per 15 minutes.
- Admin endpoints: no default limit.

## Pagination

List endpoints use page and limit parameters:

```text
GET /businesses?page=2&limit=20
```

Response pagination metadata:

```json
{
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 500,
    "pages": 25,
    "hasPrev": true,
    "hasNext": true
  }
}
```

## Localization

Responses should respect the requested `locale` and fall back in this order:

1. Requested locale.
2. Russian.
3. English.
4. Uzbek.
