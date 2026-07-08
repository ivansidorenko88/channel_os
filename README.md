# Channel OS v0.4.3 — Prisma Config Self Init Fix

## Что исправлено

BotHost запускает проект напрямую через:

```bash
node src/app.js
```

и Prisma Client не успевал сгенерироваться.

В v0.4.3 `src/config/prisma.js` сам выполняет:

```bash
npx prisma generate --schema=./prisma/schema.prisma
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

до создания `PrismaClient`.

## Что должно появиться в логах

```text
Checking Prisma Client...
Prisma Client ready.
Channel OS v0.4.3 Analytics Pro started
```

## Как залить

```bash
git add .
git commit -m "Channel OS v0.4.3 Prisma config fix"
git push
```

После пуша сделай Redeploy на BotHost.
