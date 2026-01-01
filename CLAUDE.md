# Weichieh Photography Blog

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
    layout.tsx    # Root layout with Geist font
    page.tsx      # Home page
    globals.css   # Global styles with Tailwind
public/           # Static assets (SVGs, images)
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

## Testing

No test framework is currently configured. Consider adding:
- Jest + React Testing Library for unit/integration tests
- Playwright or Cypress for E2E tests
