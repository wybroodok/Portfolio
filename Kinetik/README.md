# Kinetik

SaaS-таск-трекер с Kanban-доской, мультитенантностью и drag-and-drop в стиле
Linear. **Next.js (App Router) + TypeScript + Tailwind + Prisma + PostgreSQL**,
backend на **Server Actions**.

## Возможности

- **Kanban-доска** из 4 колонок: «К изучению» → «В работе» → «На проверке» → «Готово»
- **Drag-and-drop** (`@hello-pangea/dnd`) с оптимистичным UI и мгновенным сохранением статуса/позиции в БД
- **Мультитенантность**: рабочие пространства (Workspace) + приглашение сотрудников по инвайт-ссылке
- **Задачи**: название, Markdown-описание, дедлайн, исполнитель, приоритет; комментарии внутри карточки
- **Быстрые фильтры** без перезагрузки: «Только мои задачи», «Высокий приоритет»
- Светлая/тёмная тема

## Запуск

```bash
npm install
cp .env.example .env          # укажите DATABASE_URL и AUTH_SECRET
npx prisma migrate dev        # создать схему
npm run db:seed               # демоданные (workspace «Моя команда»)
npm run dev                   # http://localhost:3000/w/my-team/board
```

## Где что искать (главные файлы)

| Что | Файл |
|-----|------|
| Схема БД | `prisma/schema.prisma` |
| Server Action для DnD | `src/server/actions/task-actions.ts` → `moveTask` |
| Дробная индексация порядка | `src/lib/positioning.ts` |
| Компонент доски (`onDragEnd`) | `src/components/board/KanbanBoard.tsx` |
| Tenant-guard | `src/lib/tenant.ts` → `requireMembership` |

Подробнее об архитектуре — в [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).

## Как работает перемещение карточки

1. `onDragEnd` в `KanbanBoard.tsx` определяет колонку-назначение и id соседних карточек (`beforeTaskId` / `afterTaskId`).
2. Локальный стейт обновляется **оптимистично** — карточка мгновенно на новом месте.
3. Вызывается Server Action `moveTask`, который в транзакции: проверяет членство (tenant-guard), берёт позиции соседей из БД и пишет **середину** между ними → обновляется одна строка.
4. При коллапсе точности — ленивый ребаланс колонки (`rebalancedPositions`).
5. Ошибка → `router.refresh()` откатывает оптимистичное изменение к серверной правде.
