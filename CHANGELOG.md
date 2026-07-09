# Changelog

## v0.2.0 — Analytics Core

### Добавлено
- Новая таблица `AnalyticsSnapshot`.
- Новый `analyticsRepository`.
- Новый `analyticsCoreService`.
- Новый фоновый scheduler для сбора статистики каналов.
- Сбор количества подписчиков через `getChatMemberCount`.
- Сохранение количества опубликованных постов, черновиков и запланированных публикаций.
- Новый раздел `📈 Analytics Core` внутри аналитики.
- Мини-график динамики за 7 дней через unicode-блоки.
- Настройки окружения:
  - `ANALYTICS_INTERVAL_MINUTES`
  - `ANALYTICS_INITIAL_DELAY_SECONDS`

### Сохранено
- BotHost Prisma self-init fix.
- Поддержка PostgreSQL.
- Планировщик публикаций.
- Медиа-посты.
- Подключение каналов.
