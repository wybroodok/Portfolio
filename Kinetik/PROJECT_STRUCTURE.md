# Kinetik — структура проекта

Монорепозиторий на **Next.js (App Router)**. Backend реализован через
**Server Actions** (не отдельный REST-сервис) — это самый production-ready путь
для мутаций в App Router: сквозная типобезопасность от БД до клиента, отсутствие
ручной сериализации/эндпоинтов, встроенная ревалидация кэша. Внешние интеграции
(OAuth-callback, вебхуки, приём инвайтов) при необходимости живут в Route Handlers.

```
kinetik/
├── prisma/
│   ├── schema.prisma            # Модели: User, Workspace, Member, Task, Comment, Invite + enum'ы
│   └── seed.ts                  # Демоданные: workspace «Моя команда» + задачи
│
├── src/
│   ├── app/                     # App Router
│   │   ├── layout.tsx           # Root layout, шрифт, тема
│   │   ├── globals.css          # Tailwind + скроллбары
│   │   ├── (auth)/              # login / register (route group, без layout доски)
│   │   ├── w/[slug]/board/
│   │   │   └── page.tsx         # Server Component: tenant-resolve + загрузка доски
│   │   ├── invite/[token]/      # Приём инвайт-ссылки → acceptInvite
│   │   └── api/auth/[...nextauth]/route.ts   # Auth.js handlers
│   │
│   ├── components/
│   │   └── board/
│   │       ├── KanbanBoard.tsx  # ⭐ Client: DragDropContext + onDragEnd + фильтры
│   │       ├── Column.tsx       # Droppable-колонка
│   │       ├── TaskCard.tsx     # Draggable-карточка (приоритет, аватар, дедлайн)
│   │       ├── BoardFilterBar.tsx  # «Только мои» / «Высокий приоритет»
│   │       ├── BoardHeader.tsx  # Шапка + «Добавить сотрудника» (инвайт)
│   │       └── TaskModal.tsx    # Модалка задачи: описание (Markdown) + комментарии
│   │
│   ├── server/
│   │   ├── actions/
│   │   │   ├── task-actions.ts       # ⭐ moveTask / createTask / addComment
│   │   │   └── workspace-actions.ts  # createWorkspace / inviteMember / acceptInvite
│   │   └── queries/
│   │       └── board.ts              # getBoard(): задачи → колонки, sort by position
│   │
│   ├── lib/
│   │   ├── db.ts                # PrismaClient singleton
│   │   ├── auth.ts             # Auth.js (NextAuth v5) конфиг
│   │   ├── tenant.ts          # requireMembership() — ГЛАВНЫЙ tenant-guard
│   │   └── positioning.ts    # Дробная индексация порядка карточек
│   │
│   └── types/
│       └── board.ts           # BoardTask, BoardColumns, COLUMNS, BoardFilters
│
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json              # alias @/* → ./src/*
```

## Ключевые архитектурные решения

| Тема | Решение | Почему |
|------|---------|--------|
| Backend | **Server Actions** | Типобезопасность БД→UI, нет ручных эндпоинтов, `revalidatePath` |
| Мультитенантность | Пивот-таблица **Member**; `requireMembership()` в каждой мутации | Пользователь A физически не может изменить данные workspace B |
| Порядок карточек | **Дробный индекс** (`position: Float`) | Перемещение = обновление ОДНОЙ строки, а не renumber всей колонки |
| Real-time | Оптимистичный UI + `revalidatePath`; точка расширения — Postgres `LISTEN/NOTIFY` / Pusher / Ably | Мгновенный отклик при DnD, серверная правда как источник истины |
| Тема | Tailwind `darkMode: "class"` | Linear-style светлая/тёмная |
```
