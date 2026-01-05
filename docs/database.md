# Database Schema

This document describes the PostgreSQL database schema managed by Prisma ORM.

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Photo     │────<│  PhotoTag   │>────│   PhotoTag  │
└─────────────┘     └─────────────┘     │   (Table)   │
      │                                  └─────────────┘
      │
      ├────────────<┌─────────────┐
      │             │ AlbumPhoto  │>────┌─────────────┐
      │             └─────────────┘     │    Album    │
      │                                 └─────────────┘
      │
      ├────────────<┌─────────────┐
      │             │   Comment   │
      │             └─────────────┘
      │
      ├────────────<┌─────────────┐
      │             │    Like     │
      │             └─────────────┘
      │
      └────────────>┌─────────────┐
                    │   Article   │────<┌─────────────┐
                    └─────────────┘     │   Comment   │
                          │             └─────────────┘
                          │
                          └────────────<┌─────────────┐
                                        │ ArticleTag  │
                                        └─────────────┘
```

## Models

### Photo

Main table for storing photograph information.

```prisma
model Photo {
  id             Int          @id @default(autoincrement())
  slug           String       @unique
  title          String
  src            String       // Image URL
  category       String
  location       String
  latitude       Float?       // For map feature
  longitude      Float?
  date           DateTime
  camera         String?
  lens           String?
  story          String       @db.Text
  behindTheScene String?      @db.Text
  status         String       @default("published")
  publishedAt    DateTime?
  viewCount      Int          @default(0)
  likeCount      Int          @default(0)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  tags           PhotoTag[]
  albums         AlbumPhoto[]
  articleId      Int?
  article        Article?     @relation(fields: [articleId], references: [id])
  comments       Comment[]
  likes          Like[]

  // Indexes for performance
  @@index([category])
  @@index([date])
  @@index([status])
  @@index([publishedAt])
  @@index([viewCount])
  @@index([likeCount])
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `slug` | String | URL-friendly identifier (unique) |
| `src` | String | Full URL to image in R2/S3 |
| `status` | String | "published", "draft", or "scheduled" |
| `publishedAt` | DateTime? | Scheduled publish date |
| `latitude/longitude` | Float? | GPS coordinates for map |

### Article

Blog articles with markdown content.

```prisma
model Article {
  id          Int          @id @default(autoincrement())
  slug        String       @unique
  title       String
  excerpt     String       @db.Text
  content     String       @db.Text  // Markdown
  cover       String       // Cover image URL
  category    String
  readTime    Int          // Minutes to read
  date        DateTime
  status      String       @default("draft")
  publishedAt DateTime?
  viewCount   Int          @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relations
  tags        ArticleTag[]
  photos      Photo[]      // Related photos
  comments    Comment[]

  @@index([category])
  @@index([date])
  @@index([status])
  @@index([viewCount])
}
```

### Album

Photo collections/galleries.

```prisma
model Album {
  id          Int          @id @default(autoincrement())
  name        String
  slug        String       @unique
  description String?      @db.Text
  coverUrl    String?
  sortOrder   Int          @default(0)
  isPublic    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relations
  photos      AlbumPhoto[]

  @@index([slug])
  @@index([isPublic])
  @@index([sortOrder])
}
```

### AlbumPhoto

Junction table for many-to-many photo-album relationship.

```prisma
model AlbumPhoto {
  id        Int      @id @default(autoincrement())
  albumId   Int
  photoId   Int
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  album     Album    @relation(fields: [albumId], references: [id], onDelete: Cascade)
  photo     Photo    @relation(fields: [photoId], references: [id], onDelete: Cascade)

  @@unique([albumId, photoId])  // No duplicate entries
  @@index([albumId])
  @@index([photoId])
}
```

### Comment

Comments on photos and articles.

```prisma
model Comment {
  id        Int           @id @default(autoincrement())
  name      String
  content   String        @db.Text
  status    CommentStatus @default(PENDING)
  ipHash    String        // For spam detection
  createdAt DateTime      @default(now())

  // Optional relations (comment on photo OR article)
  photoId   Int?
  photo     Photo?        @relation(fields: [photoId], references: [id], onDelete: Cascade)
  articleId Int?
  article   Article?      @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([photoId])
  @@index([articleId])
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Like

Photo likes with IP-based uniqueness.

```prisma
model Like {
  id        Int      @id @default(autoincrement())
  photoId   Int
  ipHash    String   // Hashed IP for privacy
  createdAt DateTime @default(now())

  photo     Photo    @relation(fields: [photoId], references: [id], onDelete: Cascade)

  @@unique([photoId, ipHash])  // One like per IP per photo
  @@index([photoId])
}
```

### Media

Uploaded files library.

```prisma
model Media {
  id        Int        @id @default(autoincrement())
  filename  String
  url       String     @unique
  key       String     @unique  // R2/S3 object key
  mimeType  String
  size      Int        // Bytes
  width     Int?
  height    Int?
  alt       String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  tags      MediaTag[]

  @@index([createdAt])
  @@index([mimeType])
}
```

### Tags & Categories

```prisma
model PhotoTag {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  photos    Photo[]
  createdAt DateTime @default(now())
}

model PhotoCategory {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  slug      String   @unique
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model ArticleTag {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  articles  Article[]
  createdAt DateTime  @default(now())
}

model ArticleCategory {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  slug      String   @unique
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model MediaTag {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  media     Media[]
  createdAt DateTime @default(now())
}
```

### Settings

Key-value store for site configuration.

```prisma
model Settings {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Common Keys:**

| Key | Description |
|-----|-------------|
| `profile` | Site owner info (name, bio, avatar) |
| `seo` | SEO metadata (title, description, keywords) |
| `watermark` | Watermark settings (enabled, position, opacity) |

## Indexes

Indexes are created for:

- **Unique constraints**: slug, url, key
- **Foreign keys**: photoId, articleId, albumId
- **Frequently filtered fields**: category, status, date
- **Sorted fields**: viewCount, likeCount, sortOrder, createdAt

## Cascade Deletes

The following relations use cascade deletes:

- Deleting an Album removes all AlbumPhoto entries
- Deleting a Photo removes all Comments, Likes, and AlbumPhoto entries
- Deleting an Article removes all Comments

## Common Queries

### Get published photos with pagination

```typescript
const photos = await prisma.photo.findMany({
  where: {
    status: "published",
    OR: [
      { publishedAt: null },
      { publishedAt: { lte: new Date() } }
    ]
  },
  orderBy: { date: "desc" },
  take: 20,
  skip: 0,
  include: { tags: true }
});
```

### Get album with photos

```typescript
const album = await prisma.album.findUnique({
  where: { slug: "best-2024" },
  include: {
    photos: {
      orderBy: { sortOrder: "asc" },
      include: {
        photo: true
      }
    }
  }
});
```

### Get photo with all relations

```typescript
const photo = await prisma.photo.findUnique({
  where: { slug: "sunset-beach" },
  include: {
    tags: true,
    article: { select: { slug: true, title: true } },
    albums: {
      include: {
        album: { select: { slug: true, name: true } }
      }
    }
  }
});
```

## Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_new_field

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```
