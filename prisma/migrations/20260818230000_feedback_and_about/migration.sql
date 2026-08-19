-- មតិយោបល់ and អំពីយើង.
--
-- Feedback: anyone signed in may write one, and who may read the list is a
-- grant rather than a fixed rule. The author is held both as a relation and as
-- plain text — feedback outlives the account that wrote it, and a message whose
-- author was later deleted should still say who raised it and from which centre.
-- Hence ON DELETE SET NULL rather than CASCADE: losing the account must not lose
-- what they said.
--
-- AboutPage: one row by construction. The primary key defaults to the constant
-- 'about', so an upsert on it cannot produce two competing versions of a page
-- that is singular by definition.

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "userID" TEXT,
    "authorName" TEXT,
    "serviceCenterID" TEXT,
    "centreName" TEXT,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aboutPage" (
    "id" TEXT NOT NULL DEFAULT 'about',
    "title" TEXT,
    "content" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByID" TEXT,

    CONSTRAINT "aboutPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
