# Channel OS v0.4.2 — BotHost Forced Start Fix

## Что исправлено

BotHost принудительно запускает:

```bash
node src/app.js
```

и игнорирует `npm start`.

Поэтому в v0.4.2 Prisma запускается прямо в начале `src/app.js`:

```bash
npx prisma generate --schema=./prisma/schema.prisma
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

После этого запускается сам бот.

## Переменные окружения

```env
BOT_TOKEN=токен_бота
DATABASE_URL=строка_подключения_PostgreSQL
```

## Как залить

```bash
git add .
git commit -m "Channel OS v0.4.2 BotHost forced start fix"
git push
```

После пуша сделай Redeploy на BotHost.
