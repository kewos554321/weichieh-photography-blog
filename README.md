# WeiChieh Photography Blog

A modern, elegant photography blog built with Next.js 16, featuring a cinematic film aesthetic, AI-powered content generation, and comprehensive admin management.

## Features

- **Photo Gallery** - Masonry layout with category filtering and full-screen lightbox
- **Albums** - Curated photo collections with navigation
- **Blog** - Markdown-powered articles with related photos
- **Interactive Map** - Leaflet-based map showing photo locations
- **Admin Panel** - Full CRUD for photos, articles, albums, media, and comments
- **AI Integration** - Auto-generate slugs and stories using Google Generative AI
- **Scheduled Publishing** - Draft/publish workflow with scheduled release
- **Comment System** - Moderated comments with spam detection
- **Analytics** - View counts and engagement tracking

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL + Prisma ORM |
| Storage | AWS S3 / Cloudflare R2 |
| AI | Google Generative AI |
| Maps | Leaflet + React-Leaflet |
| Testing | Vitest + React Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- AWS S3 or Cloudflare R2 bucket

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd weichieh-photography-blog

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Cloudflare R2 / AWS S3
R2_ENDPOINT="https://..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_URL="https://..."

# AI (Google Generative AI)
GOOGLE_AI_API_KEY="..."
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # Public pages (photos, albums, blog, map)
│   ├── admin/             # Admin panel
│   └── api/               # REST API routes (35 endpoints)
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── comments/          # Comment system
│   ├── lightbox/          # Image lightbox
│   └── photo/             # Photo-related components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── prisma/               # Database schema

docs/                      # Documentation
├── architecture.md        # System architecture
├── api.md                # API reference
├── database.md           # Database schema
└── components.md         # Component documentation
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:coverage # Run tests with coverage
```

## Documentation

- [Architecture Overview](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Components Guide](./docs/components.md)

## Design Philosophy

- **Japanese Minimalism** - Clean, simple, let photos speak
- **Cinematic Film Look** - Subtle film grain + vignette overlays
- **Fuji Film Colors** - Teal shadows (#5a8a87) + amber highlights (#c9a77c)
- **Elegant Typography** - Cormorant Garamond + Noto Serif TC
- **Subtle Interactions** - Smooth 500-700ms transitions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
