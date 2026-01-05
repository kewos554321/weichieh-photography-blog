# API Reference

This document describes all REST API endpoints available in the application.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

Currently, API endpoints do not require authentication. Admin endpoints should be protected in production.

---

## Photos

### List Photos

```http
GET /api/photos
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 20) |
| `offset` | number | Skip results (default: 0) |
| `category` | string | Filter by category |
| `status` | string | Filter by status (admin only) |

**Response:**

```json
{
  "photos": [
    {
      "id": 1,
      "slug": "sunset-beach",
      "title": "Sunset at the Beach",
      "src": "https://...",
      "category": "Landscape",
      "location": "Taipei",
      "date": "2024-01-15T00:00:00Z",
      "viewCount": 150,
      "likeCount": 25
    }
  ],
  "total": 100
}
```

### Get Photo

```http
GET /api/photos/:slug
```

**Response:**

```json
{
  "id": 1,
  "slug": "sunset-beach",
  "title": "Sunset at the Beach",
  "src": "https://...",
  "category": "Landscape",
  "location": "Taipei",
  "latitude": 25.033,
  "longitude": 121.565,
  "date": "2024-01-15T00:00:00Z",
  "camera": "Fujifilm X-T5",
  "lens": "XF 23mm f/1.4",
  "story": "A beautiful sunset...",
  "tags": [{ "id": 1, "name": "sunset" }],
  "article": { "slug": "beach-trip", "title": "Beach Trip" },
  "albums": [{ "album": { "slug": "best-2024", "name": "Best of 2024" } }]
}
```

### Create Photo

```http
POST /api/photos
```

**Request Body:**

```json
{
  "title": "New Photo",
  "src": "https://...",
  "category": "Portrait",
  "location": "Tokyo",
  "date": "2024-01-20",
  "story": "Photo story...",
  "status": "draft",
  "tagIds": [1, 2]
}
```

### Update Photo

```http
PUT /api/photos/:slug
```

### Delete Photo

```http
DELETE /api/photos/:slug
```

### Like Photo

```http
POST /api/photos/:slug/like
```

**Response:**

```json
{
  "liked": true,
  "likeCount": 26
}
```

---

## Photo Comments

### List Comments

```http
GET /api/photos/:slug/comments
```

### Add Comment

```http
POST /api/photos/:slug/comments
```

**Request Body:**

```json
{
  "name": "John",
  "content": "Great photo!"
}
```

---

## Articles

### List Articles

```http
GET /api/articles
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results |
| `category` | string | Filter by category |
| `status` | string | Filter by status |

### Get Article

```http
GET /api/articles/:slug
```

### Create Article

```http
POST /api/articles
```

**Request Body:**

```json
{
  "title": "My Trip to Japan",
  "excerpt": "A journey through...",
  "content": "# Markdown content...",
  "cover": "https://...",
  "category": "Travel",
  "status": "draft"
}
```

### Update Article

```http
PUT /api/articles/:slug
```

### Delete Article

```http
DELETE /api/articles/:slug
```

---

## Albums

### List Albums

```http
GET /api/albums
```

**Response:**

```json
{
  "albums": [
    {
      "id": 1,
      "slug": "best-2024",
      "name": "Best of 2024",
      "description": "Top photos from 2024",
      "coverUrl": "https://...",
      "photoCount": 25,
      "isPublic": true
    }
  ]
}
```

### Get Album

```http
GET /api/albums/:slug
```

**Response:**

```json
{
  "id": 1,
  "slug": "best-2024",
  "name": "Best of 2024",
  "description": "Top photos from 2024",
  "photos": [
    { "id": 1, "slug": "photo-1", "src": "...", "title": "..." }
  ]
}
```

### Create Album

```http
POST /api/albums
```

### Update Album

```http
PUT /api/albums/:slug
```

### Delete Album

```http
DELETE /api/albums/:slug
```

---

## Comments (Admin)

### List All Comments

```http
GET /api/comments
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | PENDING, APPROVED, REJECTED |

### Update Comment Status

```http
PUT /api/comments/:id
```

**Request Body:**

```json
{
  "status": "APPROVED"
}
```

### Delete Comment

```http
DELETE /api/comments/:id
```

---

## Media

### List Media

```http
GET /api/media
```

### Upload Media

```http
POST /api/media
```

### Get Media

```http
GET /api/media/:id
```

### Update Media

```http
PUT /api/media/:id
```

### Delete Media

```http
DELETE /api/media/:id
```

---

## File Upload

### Get Presigned URL

```http
POST /api/upload
```

**Request Body:**

```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**

```json
{
  "uploadUrl": "https://r2.../presigned",
  "publicUrl": "https://pub.../photo.jpg",
  "key": "photos/abc123.jpg"
}
```

### Batch Upload

```http
POST /api/upload/batch
```

**Request Body:**

```json
{
  "files": [
    { "filename": "photo1.jpg", "contentType": "image/jpeg" },
    { "filename": "photo2.jpg", "contentType": "image/jpeg" }
  ]
}
```

---

## AI Generation

### Generate Slug

```http
POST /api/ai/generate-slug
```

**Request Body:**

```json
{
  "title": "Beautiful Sunset Photo",
  "type": "photo"
}
```

**Response:**

```json
{
  "slug": "beautiful-sunset-photo"
}
```

### Generate Story

```http
POST /api/ai/generate-story
```

**Request Body:**

```json
{
  "title": "Mountain View",
  "location": "Alps",
  "category": "Landscape"
}
```

### Generate Article

```http
POST /api/ai/generate-article
```

---

## Taxonomy

### Photo Categories

```http
GET /api/photos/categories
POST /api/photos/categories
DELETE /api/photos/categories/:id
```

### Photo Tags

```http
GET /api/photos/tags
POST /api/photos/tags
DELETE /api/photos/tags/:id
```

### Article Categories

```http
GET /api/articles/categories
POST /api/articles/categories
DELETE /api/articles/categories/:id
```

### Article Tags

```http
GET /api/articles/tags
POST /api/articles/tags
DELETE /api/articles/tags/:id
```

---

## Settings

### Profile

```http
GET /api/settings/profile
PUT /api/settings/profile
```

### SEO

```http
GET /api/settings/seo
PUT /api/settings/seo
```

### Watermark

```http
GET /api/settings/watermark
PUT /api/settings/watermark
```

---

## Analytics

### Track View

```http
POST /api/analytics/track
```

**Request Body:**

```json
{
  "type": "photo",
  "slug": "sunset-beach"
}
```

### Get Analytics

```http
GET /api/analytics
```

---

## Cron

### Publish Scheduled Content

```http
POST /api/cron/publish
```

This endpoint is called by a cron job to publish scheduled content.

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Server Error |
