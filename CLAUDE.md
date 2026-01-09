# WeiChieh Photography Blog

## Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Path Alias**: `@/*` → `./src/*`

## Commands

```bash
npm run dev      # Development server
npm run build    # Build (run before commit)
npm run lint     # Lint check
npm test         # Run tests
```

---

## UI/UX Design System (重要)

### Design Philosophy
- **Japanese Minimalism** - 簡潔留白，讓照片說話
- **Cinematic Film Look** - 電影感底片色調
- **Fuji Film Colors** - 青色陰影 + 琥珀色高光
- **Subtle Interactions** - 緩慢優雅的 500-700ms 過渡動畫

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#f7f5f2` | 暖奶油色背景 |
| Text Primary | `stone-700` | 主要文字 |
| Text Secondary | `stone-500` | 次要文字 |
| Text Muted | `stone-400` | 淡化文字 |
| Accent Teal | `#5a8a87` | Fuji 青色強調 |
| Accent Amber | `#c9a77c` | 暖色高光 |
| Border | `stone-200/50` | 細微邊框 |

### Typography
| Element | Classes |
|---------|---------|
| Logo | `font-serif text-2xl tracking-[0.15em] font-light` |
| Page Title | `font-serif text-4xl md:text-5xl font-normal` |
| Body | `text-base md:text-lg font-light leading-relaxed` |
| Meta/Label | `text-xs tracking-[0.2em] uppercase font-light` |

**Fonts**:
- English: Cormorant Garamond (serif) / Inter (sans)
- Chinese: Noto Serif TC / Noto Sans TC

### Cinematic Effects (globals.css)
- **Film Grain**: noise overlay, opacity 0.035
- **Vignette**: radial gradient edge darkening
- **Image Hover**: contrast/saturation shift

### Animation Standards
```
transition-all duration-500   // 標準過渡
transition-all duration-700   // 強調過渡
group-hover:scale-[1.02]      // 圖片 hover 放大
```

### Component Patterns

**Header (Fixed)**
```tsx
className="fixed top-0 inset-x-0 z-50 bg-stone-50/90 backdrop-blur-sm border-b border-stone-200"
```

**Card Hover**
```tsx
<div className="group">
  <Image className="transition-transform duration-500 group-hover:scale-[1.02]" />
  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
</div>
```

**Active Link**
```tsx
className={isActive ? "text-stone-900" : "text-stone-500 hover:text-stone-900"}
```

**Button (Primary)**
```tsx
className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
```

**Button (Secondary)**
```tsx
className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
```

### Responsive Breakpoints
- Mobile first
- `md:` 768px (tablet)
- `lg:` 1024px (desktop)
- Touch targets: min 44px

### Admin Panel Style
- Sidebar: `bg-stone-900 text-white`
- Content: `bg-stone-100`
- Cards: `bg-white rounded-lg shadow-sm`
- Mobile: hamburger menu in header bar

---

## URL Structure

| Page | URL |
|------|-----|
| Home (Photos) | `/` |
| Photo Detail | `/photo/{slug}` |
| Blog List | `/blog` |
| Blog Detail | `/blog/{slug}` |
| Admin | `/admin/*` |

---

## Code Style

- Prefer Server Components, use `'use client'` only when needed
- Types in `src/components/admin/types.ts`
- Test files in `/test` directory
