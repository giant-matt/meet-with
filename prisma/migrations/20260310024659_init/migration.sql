-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "organizerName" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'DATETIME',
    "timeRangeStart" TEXT NOT NULL DEFAULT '09:00',
    "timeRangeEnd" TEXT NOT NULL DEFAULT '18:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "EventDate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "eventDateId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    CONSTRAINT "Response_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Response_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "EventDate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EventDate_eventId_date_key" ON "EventDate"("eventId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_eventId_name_key" ON "Participant"("eventId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Response_participantId_eventDateId_startTime_key" ON "Response"("participantId", "eventDateId", "startTime");
