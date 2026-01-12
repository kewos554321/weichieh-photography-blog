# Tech Stack

## Core

| 技術 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.1 | Full-stack React + App Router |
| TypeScript | 5.x | Type safety (strict mode) |
| Tailwind CSS | 4.x | Utility-first CSS |
| Prisma | 6.19.1 | PostgreSQL ORM |

## Dependencies

| 技術 | 版本 | 用途 |
|------|------|------|
| Google Generative AI | 0.24 | AI 文章/故事/Slug 生成 |
| AWS S3 SDK | - | Cloudflare R2 圖片上傳 |
| bcryptjs | 3.0.3 | 密碼雜湊 |
| exifr | 7.1.3 | EXIF 元數據提取 |
| Leaflet | 1.9.4 | 地圖選擇器 |
| React Leaflet | 5.x | React 地圖組件 |
| Lucide React | 0.562 | Icon 圖標庫 |

## Testing

| 技術 | 版本 | 用途 |
|------|------|------|
| Vitest | 4.0.16 | Unit testing |
| React Testing Library | - | Component testing |

## Config Files

| 檔案 | 說明 |
|------|------|
| `tsconfig.json` | TypeScript 配置 (strict, @/* 路徑) |
| `next.config.ts` | Next.js 配置 (R2 圖片域名) |
| `eslint.config.mjs` | ESLint 配置 |
| `postcss.config.mjs` | PostCSS (Tailwind v4) |
| `vitest.config.mts` | Vitest 測試配置 |
| `prisma/schema.prisma` | 資料庫 Schema |
