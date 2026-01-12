# Commands

## Development

```bash
npm run dev          # 開發服務器 (http://localhost:3000)
npm run build        # 生產構建 (commit 前必跑)
npm run start        # 啟動生產服務
npm run lint         # ESLint 檢查
```

## Testing

```bash
npm test             # 運行測試
npm test:watch       # 監視模式
npm test:coverage    # 覆蓋率報告 (95% threshold)
```

## Database (Prisma)

```bash
npm run db:generate  # 生成 Prisma Client
npm run db:migrate   # 運行遷移
npm run db:studio    # Prisma Studio GUI (http://localhost:5555)
npx prisma db push   # 同步 schema 到 DB (開發用)
```

## Git Workflow

```bash
# commit 前
npm run build && npm run lint && npm test
```
