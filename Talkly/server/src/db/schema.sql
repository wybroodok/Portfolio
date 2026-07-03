-- Talkly — реляционная схема v2 (PostgreSQL).
-- Аккаунты с username, динамические комнаты (DM/группы), вложения, presence.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  avatar_color  TEXT NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  last_seen     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Регистронезависимый поиск/уникальность по username.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (lower(username));

CREATE TABLE IF NOT EXISTS rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL CHECK (kind IN ('dm', 'group')),
  name        TEXT NOT NULL DEFAULT '',
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS room_members (
  room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        TEXT NOT NULL,
  room_id          UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  author_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body             TEXT NOT NULL DEFAULT '',
  kind             TEXT NOT NULL DEFAULT 'text',
  attachment_url   TEXT,
  attachment_name  TEXT,
  attachment_mime  TEXT,
  attachment_size  BIGINT,
  edited_at        TIMESTAMPTZ,
  forwarded_from   TEXT,
  reactions        JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, author_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_room_created
  ON messages (room_id, created_at DESC);

CREATE TABLE IF NOT EXISTS message_reads (
  message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reader_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, reader_id)
);

-- Дефолтная группа: каждый новый пользователь автодобавляется сюда,
-- чтобы мессенджер не был пустым при первом входе (см. user.service ensureUser).
INSERT INTO rooms (id, kind, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'group', 'Talkly Lounge')
ON CONFLICT (id) DO NOTHING;
