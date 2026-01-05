# Architecture Overview

This document describes the system architecture of the WeiChieh Photography Blog.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  React Components  │  Next.js Pages  │  Client-Side Routing     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Router                          │
├─────────────────────────────────────────────────────────────────┤
│  Server Components  │  API Routes  │  Middleware                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    PostgreSQL    │ │   Cloudflare R2  │ │  Google AI API   │
│    (Prisma)      │ │   (File Storage) │ │  (Content Gen)   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## Directory Structure

```
src/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx               # Root layout (fonts, metadata)
│   ├── globals.css              # Global styles, Tailwind
│   │
│   ├── (main)/                  # Public routes (route group)
│   │   ├── layout.tsx           # Header + Footer wrapper
│   │   ├── page.tsx             # Home - Photo gallery
│   │   ├── photo/[slug]/        # Photo detail pages
│   │   ├── albums/              # Album list and detail
│   │   ├── blog/                # Blog articles
│   │   ├── map/                 # Interactive photo map
│   │   └── about/               # About page
│   │
│   ├── admin/                   # Admin panel
│   │   ├── layout.tsx           # Admin sidebar layout
│   │   ├── page.tsx             # Dashboard
│   │   ├── photos/              # Photo management
│   │   ├── articles/            # Article management
│   │   ├── albums/              # Album management
│   │   ├── media/               # Media library
│   │   ├── comments/            # Comment moderation
│   │   ├── analytics/           # Analytics dashboard
│   │   └── settings/            # Site settings
│   │
│   └── api/                     # REST API routes
│       ├── photos/              # Photo endpoints
│       ├── articles/            # Article endpoints
│       ├── albums/              # Album endpoints
│       ├── comments/            # Comment endpoints
│       ├── media/               # Media endpoints
│       ├── upload/              # File upload
│       ├── ai/                  # AI generation
│       ├── settings/            # Settings endpoints
│       ├── analytics/           # Analytics tracking
│       └── cron/                # Scheduled jobs
│
├── components/                  # React components
│   ├── Header.tsx              # Navigation header
│   ├── Footer.tsx              # Site footer
│   ├── MarkdownContent.tsx     # Markdown renderer
│   ├── MapPickerModal.tsx      # Location picker
│   ├── photo/                  # Photo components
│   ├── comments/               # Comment components
│   ├── lightbox/               # Lightbox gallery
│   └── admin/                  # Admin components
│
├── hooks/                       # Custom React hooks
│   ├── useUpload.ts            # File upload hook
│   └── useExifExtraction.ts    # EXIF extraction hook
│
├── lib/                         # Utility functions
│   ├── prisma.ts               # Database client
│   ├── slug.ts                 # Slug generation
│   ├── upload.ts               # Upload utilities
│   ├── exif.ts                 # EXIF extraction
│   ├── watermark.ts            # Image watermarking
│   ├── publish.ts              # Publishing logic
│   └── rateLimit.ts            # Rate limiting
│
└── prisma/
    └── schema.prisma           # Database schema
```

## Key Design Patterns

### 1. Route Groups

Next.js route groups organize pages without affecting URLs:

- `(main)` - Public-facing pages with Header/Footer
- `admin` - Admin panel with sidebar navigation

### 2. Server vs Client Components

```tsx
// Server Component (default) - runs on server
export default function PhotoPage() {
  // Can fetch data directly
  const photo = await prisma.photo.findUnique(...);
  return <PhotoDisplay photo={photo} />;
}

// Client Component - runs in browser
"use client";
export function LikeButton() {
  const [liked, setLiked] = useState(false);
  // Can use hooks, event handlers
}
```

### 3. API Route Pattern

```tsx
// src/app/api/photos/route.ts
export async function GET(request: NextRequest) {
  const photos = await prisma.photo.findMany();
  return NextResponse.json({ photos });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const photo = await prisma.photo.create({ data: body });
  return NextResponse.json(photo);
}
```

### 4. Singleton Pattern (Prisma)

```tsx
// src/lib/prisma.ts
const globalForPrisma = global as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

## Data Flow

### Photo Upload Flow

```
1. User selects image(s)
         │
         ▼
2. Client requests presigned URLs
   POST /api/upload/batch
         │
         ▼
3. Client uploads directly to R2
   PUT <presigned-url>
         │
         ▼
4. Server creates database record
   POST /api/photos
         │
         ▼
5. EXIF extraction (camera, lens, date)
         │
         ▼
6. Optional: Apply watermark
```

### Content Publishing Flow

```
1. Admin creates content (draft)
         │
         ▼
2. Sets publishedAt date (optional)
         │
         ▼
3. Cron job checks every 60s
   GET /api/cron/publish
         │
         ▼
4. Updates status to "published"
   WHERE publishedAt <= now()
         │
         ▼
5. Content visible on public pages
```

## Security Considerations

### Current Implementation

- **Admin Access**: Currently unprotected (development mode)
- **Comments**: IP-based spam detection
- **Likes**: One like per IP per photo
- **Rate Limiting**: In-memory rate limiter

### Recommended for Production

- Add authentication (NextAuth.js / Clerk)
- Move rate limiting to Redis
- Add CSRF protection
- Implement proper admin authentication

## Performance Optimizations

### Image Handling

- Direct-to-S3 uploads (bypass server)
- Next.js Image optimization
- Lazy loading for gallery images
- Preloading adjacent lightbox images

### Database

- Indexed fields for common queries
- Pagination for list endpoints
- Selective field inclusion

### Frontend

- React Server Components (reduce JS bundle)
- Dynamic imports for heavy components (Leaflet)
- CSS-in-JS scoped to components

## External Services

| Service | Purpose | Environment Variable |
|---------|---------|---------------------|
| PostgreSQL | Database | `DATABASE_URL` |
| Cloudflare R2 | File storage | `R2_*` |
| Google AI | Content generation | `GOOGLE_AI_API_KEY` |
| Nominatim | Geocoding (map search) | N/A (free API) |
