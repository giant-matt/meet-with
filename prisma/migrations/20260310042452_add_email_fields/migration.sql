-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "organizerName" TEXT NOT NULL,
    "organizerEmail" TEXT NOT NULL DEFAULT '',
    "mode" TEXT NOT NULL DEFAULT 'DATETIME',
    "timeRangeStart" TEXT NOT NULL DEFAULT '09:00',
    "timeRangeEnd" TEXT NOT NULL DEFAULT '18:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("createdAt", "description", "id", "mode", "organizerName", "slotDuration", "slug", "timeRangeEnd", "timeRangeStart", "timezone", "title", "updatedAt") SELECT "createdAt", "description", "id", "mode", "organizerName", "slotDuration", "slug", "timeRangeEnd", "timeRangeStart", "timezone", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE TABLE "new_Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("createdAt", "eventId", "id", "name") SELECT "createdAt", "eventId", "id", "name" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
CREATE UNIQUE INDEX "Participant_eventId_name_key" ON "Participant"("eventId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
