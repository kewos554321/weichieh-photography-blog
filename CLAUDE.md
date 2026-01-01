# WeiChieh Photography Blog

A photography blog website built with Next.js.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 19
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint 9 with `eslint-config-next` (core-web-vitals + typescript)

## Project Structure

```
src/
  app/
    layout.tsx           # Root layout with Geist font
    page.tsx             # Home - Photo wall
    globals.css          # Global styles with Tailwind
    photo/
      [slug]/page.tsx    # Photo detail with story
    blog/
      page.tsx           # Blog article list
      [slug]/page.tsx    # Blog article detail
    admin/
      page.tsx           # Admin panel for uploads
public/                  # Static assets (SVGs, images)
```

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Development Guidelines

### Before Committing
- Run `npm run build` to ensure the project builds successfully
- Run `npm run lint` to ensure no ESLint errors

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules (core-web-vitals + typescript)
- Use Tailwind CSS for styling
- Prefer Server Components by default
- Use `'use client'` directive only when needed

### Path Aliases
- `@/*` maps to `./src/*`

### Fonts
- Primary: Geist Sans (`--font-geist-sans`)
- Monospace: Geist Mono (`--font-geist-mono`)

---

## UI/UX Design Guidelines

### Design Philosophy
- **Minimalist & Clean**: Let photos be the focus, minimal UI distractions
- **Stone Color Palette**: Use `stone-50` to `stone-900` for consistency
- **Serif for Headings**: Font-serif for titles, sans-serif for body text
- **Subtle Interactions**: Gentle hover effects (scale, opacity transitions)

### Color Scheme
```
Background:    stone-50 (#fafaf9)
Text Primary:  stone-900 (#1c1917)
Text Secondary: stone-500 (#78716c)
Text Muted:    stone-400 (#a8a29e)
Borders:       stone-200 (#e7e5e4)
```

### Typography
- **Logo/Brand**: font-serif, text-2xl (desktop), text-xl (mobile)
- **Page Titles**: font-serif, text-4xl to text-5xl
- **Body Text**: text-base to text-lg, leading-relaxed
- **Meta Info**: text-sm, tracking-widest, text-stone-400

### Layout Patterns

#### Photo Wall (Home)
- Masonry layout with CSS columns
- 2 columns (mobile) → 3 columns (tablet) → 4 columns (desktop)
- Small gaps between photos
- Hover: subtle scale (1.02) + overlay

#### Photo Detail
- Full-width image centered, max-height 70vh
- Story below with max-width 2xl for readability
- Previous/Next navigation at bottom

#### Blog List
- Alternating image left/right layout
- Image + excerpt side by side on desktop
- Stacked on mobile

#### Blog Article
- Full-width cover image with dark overlay
- Content max-width 3xl for comfortable reading
- Headings parsed from markdown (## → h2)

### Responsive Design (Mobile First)
- **Breakpoints**: `md:` (768px), `lg:` (1024px)
- **Touch Targets**: Minimum 44px height for buttons/links
- **Navigation**: Show only Photos + Blog on mobile, hide About/Contact
- **Padding**: Smaller on mobile (`px-4`), larger on desktop (`px-6`)
- **Typography**: Slightly smaller on mobile, scale up on desktop

### Component Patterns

#### Header (Fixed)
```tsx
<header className="fixed top-0 left-0 right-0 z-50 bg-stone-50/90 backdrop-blur-sm border-b border-stone-200">
```

#### Card Hover Effect
```tsx
<div className="group">
  <Image className="transition-transform duration-500 group-hover:scale-[1.02]" />
  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
</div>
```

#### Navigation Link (Active State)
```tsx
<Link className={isActive ? "text-stone-900" : "text-stone-500 hover:text-stone-900"}>
```

---

## URL Structure

### Photos
- List: `/`
- Detail: `/photo/{slug}` (e.g., `/photo/silent-gaze`)
- Slug format: lowercase, hyphen-separated, unique

### Blog
- List: `/blog`
- Detail: `/blog/{slug}` (e.g., `/blog/mountain-photography-tips`)

### Admin
- Dashboard: `/admin`

---

## Data Structure

### Photo
```typescript
{
  id: number;
  slug: string;           // URL-friendly identifier
  src: string;            // Image URL
  title: string;          // Display title
  category: string;       // Portrait | Landscape | Street | Nature
  location: string;       // Where the photo was taken
  date: string;           // YYYY-MM-DD format
  story: string;          // The story behind the photo
}
```

### Article
```typescript
{
  id: number;
  slug: string;           // URL-friendly identifier
  title: string;          // Article title
  excerpt: string;        // Short description
  content: string;        // Full content (markdown supported)
  cover: string;          // Cover image URL
  category: string;       // 技巧分享 | 旅行日記 | 攝影思考
  date: string;           // YYYY-MM-DD format
}
```

---

## Testing

No test framework is currently configured. Consider adding:
- Jest + React Testing Library for unit/integration tests
- Playwright or Cypress for E2E tests

---

## Future Improvements

### Backend Integration
The admin panel currently has no backend. Recommended options:
- **Supabase**: PostgreSQL database + image storage
- **Firebase**: Firestore + Cloud Storage
- **Contentful/Sanity**: Headless CMS for content management
- **Custom API**: Prisma + AWS S3

### Features to Consider
- Image optimization pipeline
- SEO meta tags for each page
- Social sharing cards
- Comments system
- Newsletter subscription
- Dark mode toggle
