import { PrismaClient, TaskStatus, TaskPriority, MemberRole } from "@prisma/client";
import { POSITION_STEP } from "../src/lib/positioning";

const db = new PrismaClient();

async function main() {
  const alice = await db.user.upsert({
    where: { email: "alice@kinetik.dev" },
    update: {},
    create: { email: "alice@kinetik.dev", name: "Alice Ivanova" },
  });
  const bob = await db.user.upsert({
    where: { email: "bob@kinetik.dev" },
    update: {},
    create: { email: "bob@kinetik.dev", name: "Bob Petrov" },
  });

  const ws = await db.workspace.upsert({
    where: { slug: "my-team" },
    update: {},
    create: {
      name: "Моя команда",
      slug: "my-team",
      type: "TEAM",
      members: {
        create: [
          { userId: alice.id, role: MemberRole.OWNER },
          { userId: bob.id, role: MemberRole.MEMBER },
        ],
      },
    },
  });

  // A personal board for Alice, so the workspace switcher has something to switch to.
  await db.workspace.upsert({
    where: { slug: "alice-personal" },
    update: {},
    create: {
      name: "Личные задачи",
      slug: "alice-personal",
      type: "PERSONAL",
      members: { create: [{ userId: alice.id, role: MemberRole.OWNER }] },
    },
  });

  const seed: { title: string; status: TaskStatus; priority: TaskPriority; assigneeId: string }[] = [
    { title: "Изучить требования к API", status: "BACKLOG", priority: "MEDIUM", assigneeId: alice.id },
    { title: "Настроить CI/CD", status: "BACKLOG", priority: "LOW", assigneeId: bob.id },
    { title: "Сверстать Kanban-доску", status: "IN_PROGRESS", priority: "HIGH", assigneeId: alice.id },
    { title: "Реализовать drag-and-drop", status: "IN_REVIEW", priority: "HIGH", assigneeId: bob.id },
    { title: "Схема базы данных", status: "DONE", priority: "MEDIUM", assigneeId: alice.id },
  ];

  // Assign each task a spaced-out position within its column.
  const perColumn: Record<string, number> = {};
  for (const t of seed) {
    perColumn[t.status] = (perColumn[t.status] ?? 0) + 1;
    await db.task.create({
      data: {
        ...t,
        workspaceId: ws.id,
        creatorId: alice.id,
        position: perColumn[t.status] * POSITION_STEP,
      },
    });
  }

  console.log(`Seeded workspace "${ws.name}" (/w/${ws.slug}/board) with ${seed.length} tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
