# Database Schema

**ORM**: Prisma 6.19.1
**Database**: PostgreSQL
**Schema**: `prisma/schema.prisma`

## Models Overview

```
Photo ─┬─ PhotoTag (多對多)
       ├─ Post (多對一)
       ├─ AlbumPhoto ─── Album
       ├─ Comment
       ├─ Like
       └─ AccessTokenPhoto ─── AccessToken

Post ──┬─ PostTag (多對多)
       ├─ Photo[] (一對多)
       └─ Comment

Album ─┬─ AlbumPhoto ─── Photo
       ├─ AlbumCategory (多對一)
       ├─ AlbumTag (多對多)
       └─ AccessTokenAlbum ─── AccessToken

Media ─┬─ MediaTag (多對多)
       └─ MediaFolder (多對一，階層結構)
```

## Core Models

### Photo
| 欄位 | 類型 | 說明 |
|------|------|------|
| slug | String | 唯一識別 |
| title, src, category, location | String | 基本資訊 |
| latitude, longitude | Float? | GPS 座標 |
| camera, lens | String? | EXIF 資訊 |
| story | Text | 照片故事 |
| behindTheScene | Text? | 幕後故事 |
| status | String | draft/published |
| visibility | String | public/private |
| viewCount, likeCount | Int | 統計 |
| postId | Int? | 關聯文章 |

### Post
| 欄位 | 類型 | 說明 |
|------|------|------|
| slug | String | 唯一識別 |
| title, excerpt, content | String/Text | 內容 |
| cover | String | 封面圖 |
| category | String | 分類 |
| readTime | Int | 閱讀時間 (分鐘) |
| status | String | draft/published |

### Album
| 欄位 | 類型 | 說明 |
|------|------|------|
| slug, name | String | 基本資訊 |
| description | Text? | 描述 |
| coverUrl | String? | 封面 |
| visibility | String | public/private |
| sortOrder | Int | 排序 |

### Media
| 欄位 | 類型 | 說明 |
|------|------|------|
| filename, url, key | String | 檔案資訊 |
| mimeType | String | 檔案類型 |
| size, width, height | Int | 尺寸 |
| folderId | Int? | 所屬資料夾 |

### AccessToken
| 欄位 | 類型 | 說明 |
|------|------|------|
| name | String | 名稱 (如 "攝影圈朋友") |
| token | String | Token 字串 |
| expiresAt | DateTime? | 過期時間 |
| isActive | Boolean | 是否啟用 |

## Enums

```prisma
enum CommentStatus {
  PENDING   // 待審核
  APPROVED  // 已通過
  REJECTED  // 已拒絕
}
```

## Common Queries

```typescript
// 取得已發布照片
prisma.photo.findMany({
  where: { status: 'published', visibility: 'public' },
  orderBy: { date: 'desc' }
})

// 取得照片含標籤
prisma.photo.findUnique({
  where: { slug },
  include: { tags: true, comments: true }
})

// 取得相簿含照片
prisma.album.findUnique({
  where: { slug },
  include: {
    photos: {
      include: { photo: true },
      orderBy: { sortOrder: 'asc' }
    }
  }
})
```
