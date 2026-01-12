# Code Style

## General

- **Server Components 優先**: 只在需要互動時使用 `'use client'`
- **Path Alias**: 使用 `@/` 而非相對路徑
- **Types 集中**: Admin 類型放 `src/components/admin/types.ts`

## TypeScript

```typescript
// 使用 interface 定義 props
interface PhotoCardProps {
  photo: Photo
  onSelect?: (id: number) => void
}

// 使用 type 定義聯合類型
type Status = 'draft' | 'published'
type Visibility = 'public' | 'private'
```

## Component Structure

```tsx
// 1. imports
import { useState } from 'react'
import { Photo } from '@/components/admin/types'

// 2. types/interfaces
interface Props {
  photo: Photo
}

// 3. component
export function PhotoCard({ photo }: Props) {
  // hooks
  const [isOpen, setIsOpen] = useState(false)

  // handlers
  const handleClick = () => setIsOpen(true)

  // render
  return (...)
}
```

## API Routes

```typescript
// src/app/api/photos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const photos = await prisma.photo.findMany()
    return NextResponse.json(photos)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch' },
      { status: 500 }
    )
  }
}
```

## Naming Conventions

| 類型 | 命名 | 範例 |
|------|------|------|
| Component | PascalCase | `PhotoCard.tsx` |
| Hook | camelCase + use | `useUpload.ts` |
| Utility | camelCase | `formatDate.ts` |
| API Route | kebab-case | `generate-slug/route.ts` |
| CSS Class | kebab-case | `photo-card` |

## File Organization

```
components/
├── admin/
│   ├── photos/
│   │   ├── PhotoModal.tsx      # 主要組件
│   │   ├── PhotoListContent.tsx
│   │   └── index.ts            # barrel export
│   └── types.ts                # 共用類型
```

## Import Order

1. React / Next.js
2. External libraries
3. Internal components (`@/components`)
4. Hooks (`@/hooks`)
5. Utils (`@/lib`)
6. Types
7. Styles
