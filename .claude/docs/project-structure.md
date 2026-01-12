# Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin 後台 (layout group)
│   │   └── admin/
│   │       ├── albums/           # 相簿管理
│   │       ├── analytics/        # 數據分析
│   │       ├── categories-tags/  # 分類標籤
│   │       ├── comments/         # 留言審核
│   │       ├── media/            # 媒體庫
│   │       ├── photos/           # 照片管理
│   │       ├── posts/            # 文章管理
│   │       ├── settings/         # 網站設定
│   │       └── tokens/           # Token 管理
│   │
│   ├── (main)/                   # 前台 (layout group)
│   │   ├── page.tsx              # 首頁 (照片牆)
│   │   ├── photo/[slug]/         # 照片詳情
│   │   ├── blog/                 # 文章列表
│   │   │   └── [slug]/           # 文章詳情
│   │   ├── albums/               # 相簿列表
│   │   │   └── [slug]/           # 相簿詳情
│   │   ├── about/                # 關於頁
│   │   ├── map/                  # 地圖視圖
│   │   └── private/              # Token 保護頁
│   │
│   ├── api/                      # API Routes (47個)
│   ├── globals.css               # 全局樣式
│   ├── robots.ts                 # SEO robots.txt
│   └── sitemap.ts                # SEO sitemap.xml
│
├── components/
│   ├── admin/                    # 後台組件
│   │   ├── types.ts              # 後台 TypeScript 類型
│   │   ├── albums/               # 相簿組件
│   │   ├── media/                # 媒體庫組件
│   │   ├── photos/               # 照片組件
│   │   ├── posts/                # 文章組件
│   │   ├── settings/             # 設定組件
│   │   └── shared/               # 共用組件 (DataGrid 等)
│   │
│   ├── Header.tsx                # 頂部導航
│   ├── Footer.tsx                # 頁腳
│   ├── home/PhotoWall.tsx        # 首頁照片牆
│   ├── lightbox/                 # 圖片燈箱
│   ├── photo/                    # 照片相關 (Like, BeforeAfter)
│   ├── comments/                 # 留言組件
│   └── skeletons/                # 載入骨架
│
├── hooks/                        # Custom Hooks
│   ├── useDarkMode.ts
│   ├── useExifExtraction.ts
│   ├── useUpload.ts
│   └── useBulkSelection.ts
│
└── lib/                          # 工具函數
    ├── prisma.ts                 # Prisma singleton
    ├── upload.ts                 # S3/R2 上傳
    ├── exif.ts                   # EXIF 解析
    ├── watermark.ts              # 浮水印
    ├── publish.ts                # 定時發布
    ├── rateLimit.ts              # 速率限制
    ├── seo.ts                    # SEO helpers
    ├── slug.ts                   # Slug 生成
    └── utils.ts                  # 通用工具
```

## URL Structure

| 頁面 | URL |
|------|-----|
| 首頁 (照片牆) | `/` |
| 照片詳情 | `/photo/{slug}` |
| 文章列表 | `/blog` |
| 文章詳情 | `/blog/{slug}` |
| 相簿列表 | `/albums` |
| 相簿詳情 | `/albums/{slug}` |
| 關於 | `/about` |
| 地圖 | `/map` |
| 私密內容 | `/private?token=xxx` |
| 後台 | `/admin/*` |
