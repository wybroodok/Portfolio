import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { env } from '../config/env.js';
import { signToken } from '../services/auth.service.js';
import {
  registerUser,
  getUserByUsername,
  searchUsers,
  updateProfile,
  UsernameTakenError,
} from '../services/user.service.js';
import {
  listRoomsForUser,
  createOrGetDm,
  createGroup,
  addMember,
  getRoom,
  isMember,
} from '../services/room.service.js';
import { requireAuth } from './auth.middleware.js';
import type { TalklyServer } from '../socket/index.js';
import type { Attachment, MessageKind, Room } from '../../../shared/events.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/** Пуш комнаты всем её участникам (обновляет их списки чатов в реалтайме). */
function broadcastRoom(io: TalklyServer, room: Room): void {
  for (const m of room.members) {
    io.to(`user:${m.id}`).emit('room:upsert', room);
  }
}

export function createRoutes(io: TalklyServer): Router {
  const router = Router();

  const upload = multer({
    storage: multer.diskStorage({
      destination: env.uploadDir,
      filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
    }),
    limits: { fileSize: env.maxUploadBytes },
  });

  /* ---------------- Auth ---------------- */

  router.post('/auth/register', async (req, res) => {
    const username = String(req.body?.username ?? '').trim();
    const displayName = String(req.body?.displayName ?? '').trim() || username;
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: 'username: 3–20 символов, латиница/цифры/_' });
    }
    try {
      const user = await registerUser(username, displayName);
      res.json({ token: signToken(user.id), user });
    } catch (e) {
      if (e instanceof UsernameTakenError) {
        return res.status(409).json({ error: 'Юзернейм уже занят' });
      }
      throw e;
    }
  });

  // DEV-логин по юзернейму без пароля.
  router.post('/auth/login', async (req, res) => {
    const username = String(req.body?.username ?? '').trim();
    const user = await getUserByUsername(username);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ token: signToken(user.id), user });
  });

  /* ---------------- Профиль ---------------- */

  router.get('/me', requireAuth, (req, res) => res.json(req.user));

  router.patch('/me', requireAuth, async (req, res) => {
    const { displayName, bio, avatarColor, avatarUrl } = req.body ?? {};

    // avatarUrl принимаем только как выданный сервером /uploads/-URL (или сброс в null).
    let avatarUrlPatch: string | null | undefined;
    if (avatarUrl === undefined) avatarUrlPatch = undefined;
    else if (avatarUrl === null || avatarUrl === '') avatarUrlPatch = null;
    else if (
      typeof avatarUrl === 'string' &&
      avatarUrl.startsWith(`${env.publicUrl}/uploads/`) &&
      !avatarUrl.includes('..')
    ) {
      avatarUrlPatch = avatarUrl;
    } else {
      return res.status(400).json({ error: 'invalid avatarUrl' });
    }

    // avatarColor — только безопасный CSS-цвет (hex/hsl/rgb), чтобы исключить CSS-инъекцию.
    let avatarColorPatch: string | undefined;
    if (avatarColor != null) {
      const c = String(avatarColor).trim().slice(0, 64);
      if (!/^(#[0-9a-fA-F]{3,8}|(hsl|rgb)a?\([\d\s.,%/]+\))$/.test(c)) {
        return res.status(400).json({ error: 'invalid avatarColor' });
      }
      avatarColorPatch = c;
    }

    const updated = await updateProfile(req.user!.id, {
      displayName: displayName != null ? String(displayName).trim().slice(0, 80) : undefined,
      bio: bio != null ? String(bio).slice(0, 280) : undefined,
      avatarColor: avatarColorPatch,
      avatarUrl: avatarUrlPatch,
    });
    res.json(updated);
  });

  /* ---------------- Пользователи ---------------- */

  router.get('/users/search', requireAuth, async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 1) return res.json([]);
    res.json(await searchUsers(q, req.user!.id));
  });

  router.get('/users/:username', requireAuth, async (req, res) => {
    const user = await getUserByUsername(req.params.username ?? '');
    if (!user) return res.status(404).json({ error: 'not found' });
    res.json(user);
  });

  /* ---------------- Комнаты ---------------- */

  router.get('/rooms', requireAuth, async (req, res) => {
    res.json(await listRoomsForUser(req.user!.id));
  });

  router.post('/rooms/dm', requireAuth, async (req, res) => {
    const other = await getUserByUsername(String(req.body?.username ?? '').trim());
    if (!other) return res.status(404).json({ error: 'Пользователь не найден' });
    if (other.id === req.user!.id) return res.status(400).json({ error: 'Нельзя написать себе' });
    const room = await createOrGetDm(req.user!.id, other.id);
    broadcastRoom(io, room);
    res.json(room);
  });

  router.post('/rooms/group', requireAuth, async (req, res) => {
    const name = String(req.body?.name ?? '').trim();
    const usernames: string[] = Array.isArray(req.body?.memberUsernames) ? req.body.memberUsernames : [];
    const memberIds: string[] = [];
    for (const u of usernames) {
      const found = await getUserByUsername(String(u).trim());
      if (found) memberIds.push(found.id);
    }
    const room = await createGroup(req.user!.id, name, memberIds);
    broadcastRoom(io, room);
    res.json(room);
  });

  router.post('/rooms/:id/members', requireAuth, async (req, res) => {
    const roomId = req.params.id ?? '';
    if (!(await isMember(roomId, req.user!.id))) {
      return res.status(403).json({ error: 'Вы не участник этой комнаты' });
    }
    const room = await getRoom(roomId);
    if (!room || room.kind !== 'group') {
      return res.status(400).json({ error: 'Добавлять участников можно только в группы' });
    }
    const other = await getUserByUsername(String(req.body?.username ?? '').trim());
    if (!other) return res.status(404).json({ error: 'Пользователь не найден' });
    const updated = await addMember(roomId, other.id);
    broadcastRoom(io, updated);
    res.json(updated);
  });

  /* ---------------- Загрузка файлов ---------------- */

  router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'no file' });
    const kind: MessageKind = req.file.mimetype.startsWith('image/')
      ? ('image' as MessageKind)
      : req.file.mimetype.startsWith('video/')
        ? ('video' as MessageKind)
        : ('file' as MessageKind);
    const attachment: Attachment = {
      url: `${env.publicUrl}/uploads/${req.file.filename}`,
      name: req.file.originalname,
      mime: req.file.mimetype,
      size: req.file.size,
    };
    res.json({ attachment, kind });
  });

  return router;
}
