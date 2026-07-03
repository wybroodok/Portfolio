-- CreateTable: many-to-many task assignees
CREATE TABLE "TaskAssignee" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("taskId","userId")
);

-- CreateIndex
CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

-- Backfill: preserve existing single assignees before dropping the column
INSERT INTO "TaskAssignee" ("taskId", "userId")
SELECT "id", "assigneeId" FROM "Task" WHERE "assigneeId" IS NOT NULL;

-- DropForeignKey + DropIndex + DropColumn (old single assignee)
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeId_fkey";
DROP INDEX "Task_assigneeId_idx";
ALTER TABLE "Task" DROP COLUMN "assigneeId";

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
