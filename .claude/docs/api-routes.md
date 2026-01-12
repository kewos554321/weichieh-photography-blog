# API Routes

共 47 個 API 路由，均在 `src/app/api/` 目錄下。

## Photos

| 路由 | Method | 功能 |
|------|--------|------|
| `/api/photos` | GET, POST | 列表/新增照片 |
| `/api/photos/[slug]` | GET, PUT, DELETE | 單張照片 CRUD |
| `/api/photos/[slug]/like` | POST | 按讚 |
| `/api/photos/[slug]/comments` | GET, POST | 照片留言 |
| `/api/photos/categories` | GET, POST | 照片分類 |
| `/api/photos/categories/[id]` | PUT, DELETE | 單個分類 |
| `/api/photos/tags` | GET, POST | 照片標籤 |
| `/api/photos/tags/[id]` | DELETE | 刪除標籤 |

## Posts

| 路由 | Method | 功能 |
|------|--------|------|
| `/api/posts` | GET, POST | 列表/新增文章 |
| `/api/posts/[slug]` | GET, PUT, DELETE | 單篇文章 CRUD |
| `/api/posts/categories` | GET, POST | 文章分類 |
| `/api/posts/tags` | GET, POST | 文章標籤 |

## Albums

| 路由 | Method | 功能 |
|------|--------|------|
| `/api/albums` | GET, POST | 列表/新增相簿 |
| `/api/albums/[slug]` | GET, PUT, DELETE | 單個相簿 CRUD |
| `/api/albums/[slug]/photos` | GET, POST, DELETE | 相簿內照片管理 |
| `/api/albums/categories` | GET, POST | 相簿分類 |
| `/api/albums/tags` | GET, POST | 相簿標籤 |

## Media

| 路由 | Method | 功能 |
|------|--------|------|
| `/api/media` | GET, POST | 媒體庫列表/上傳 |
| `/api/media/[id]` | GET, DELETE | 單個媒體 |
| `/api/media/[id]/edit` | PUT | 編輯媒體資訊 |
| `/api/media/folders` | GET, POST | 資料夾列表/新增 |
| `/api/media/folders/[id]` | PUT, DELETE | 單個資料夾 |
| `/api/media/tags` | GET, POST | 媒體標籤 |

## Upload

| 路由 | Method | 功能 |
|------|--------|------|
| `/api/upload` | POST | 單檔上傳到 R2 |
| `/api/upload/batch` | POST | 批量上傳 |

## AI

| 路由 | Method | 功能 |
|------|--------|------|
| `/api/ai/generate-post` | POST | AI 生成文章 |
| `/api/ai/generate-slug` | POST | AI 生成 Slug |
| `/api/ai/generate-story` | POST | AI 生成照片故事 |

## Settings

| 路由 | Method | 功能 |
|------|--------|------|
| `/api/settings/profile` | GET, PUT | 個人檔案 |
| `/api/settings/seo` | GET, PUT | SEO 設定 |
| `/api/settings/cover-photo` | GET, PUT | 封面圖片 |
| `/api/settings/watermark` | GET, PUT | 浮水印設定 |

## Others

| 路由 | Method | 功能 |
|------|--------|------|
| `/api/comments` | GET | 所有留言 (審核用) |
| `/api/comments/[id]` | PUT, DELETE | 審核/刪除留言 |
| `/api/analytics` | GET | 統計數據 |
| `/api/analytics/track` | POST | 追蹤事件 |
| `/api/auth/token` | POST | Token 驗證 |
| `/api/admin/tokens` | GET, POST | Token 管理 |
| `/api/admin/tokens/[id]` | PUT, DELETE | 單個 Token |
| `/api/cron/publish` | POST | 定時發布任務 |
