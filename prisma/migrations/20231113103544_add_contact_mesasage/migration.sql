-- CreateTable
CREATE TABLE "contactMessage" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "details" TEXT,
    "reason" TEXT,
    "serviceCenterName" TEXT,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserTocontactMessage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "contactMessage_id_key" ON "contactMessage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_UserTocontactMessage_AB_unique" ON "_UserTocontactMessage"("A", "B");

-- CreateIndex
CREATE INDEX "_UserTocontactMessage_B_index" ON "_UserTocontactMessage"("B");

-- AddForeignKey
ALTER TABLE "_UserTocontactMessage" ADD CONSTRAINT "_UserTocontactMessage_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserTocontactMessage" ADD CONSTRAINT "_UserTocontactMessage_B_fkey" FOREIGN KEY ("B") REFERENCES "contactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
