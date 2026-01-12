# Testing

**Framework**: Vitest 4.0.16 + React Testing Library
**Coverage Threshold**: 95%

## Structure

```
test/
├── api/           # API route 測試 (25個)
├── components/    # Component 測試 (13個)
├── hooks/         # Hook 測試 (4個)
├── lib/           # Utility 測試 (8個)
└── mocks/
    └── prisma.ts  # Prisma mock
```

## Commands

```bash
npm test              # 運行所有測試
npm test:watch        # 監視模式
npm test:coverage     # 覆蓋率報告
npm test -- PhotoCard # 運行特定測試
```

## Writing Tests

### Component Test

```typescript
// test/components/PhotoCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoCard } from '@/components/photo/PhotoCard'

describe('PhotoCard', () => {
  const mockPhoto = {
    id: 1,
    slug: 'test-photo',
    title: 'Test Photo',
    src: '/test.jpg'
  }

  it('renders photo title', () => {
    render(<PhotoCard photo={mockPhoto} />)
    expect(screen.getByText('Test Photo')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<PhotoCard photo={mockPhoto} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})
```

### API Test

```typescript
// test/api/photos.test.ts
import { GET, POST } from '@/app/api/photos/route'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma')

describe('GET /api/photos', () => {
  it('returns photos list', async () => {
    vi.mocked(prisma.photo.findMany).mockResolvedValue([
      { id: 1, title: 'Photo 1' }
    ])

    const response = await GET(new Request('http://localhost/api/photos'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
  })
})
```

### Hook Test

```typescript
// test/hooks/useUpload.test.ts
import { renderHook, act } from '@testing-library/react'
import { useUpload } from '@/hooks/useUpload'

describe('useUpload', () => {
  it('updates progress during upload', async () => {
    const { result } = renderHook(() => useUpload())

    await act(async () => {
      await result.current.upload(mockFile)
    })

    expect(result.current.progress).toBe(100)
  })
})
```

## Excluded from Coverage

- `src/components/admin/**` (E2E 測試)
- `src/app/**/page.tsx` (E2E 測試)
- `src/components/MapPickerModal.tsx` (動態 Leaflet)
- `src/app/api/media/**` (E2E 測試)
- `**/index.ts` (barrel exports)

## Mocking

```typescript
// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    photo: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))

// Mock Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/test'
}))
```
