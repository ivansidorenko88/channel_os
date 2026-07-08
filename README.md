# Channel OS v0.4.1 — Analytics Pro BotHost Fix

## Что исправлено

BotHost собирает проект так, что `npm install` выполняется до копирования папки `prisma`.

Из-за этого в v0.4 падала команда:

```bash
prisma generate
```

с ошибкой:

```text
Could not find Prisma Schema
```

В v0.4.1 исправлено:

- убран `postinstall`;
- `prisma generate` перенесен в `npm start`;
- Prisma CLI перенесена в `dependencies`, чтобы работала на production-сборке BotHost;
- в командах явно указан путь `--schema=./prisma/schema.prisma`.

## Команда запуска

```bash
npm start
```

## Переменные окружения BotHost

```env
BOT_TOKEN=токен_бота
DATABASE_URL=строка_подключения_PostgreSQL
```

## Как залить

```bash
git add .
git commit -m "Channel OS v0.4.1 BotHost Prisma fix"
git push
```
