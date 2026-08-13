-- CreateTable
CREATE TABLE "clientTypes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serviceTypes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serviceTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rehabGroups" (
    "id" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rehabGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rehabTypes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rehabTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rehabilitations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rehabilitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistiveGroups" (
    "id" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistiveGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistiveTypes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistiveTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistiveDevices" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "photo" TEXT,
    "nameKh" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistiveDevices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientTypes_code_key" ON "clientTypes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "serviceTypes_code_key" ON "serviceTypes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rehabTypes_code_key" ON "rehabTypes"("code");

-- CreateIndex
CREATE INDEX "rehabTypes_groupId_idx" ON "rehabTypes"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "rehabilitations_code_key" ON "rehabilitations"("code");

-- CreateIndex
CREATE INDEX "rehabilitations_typeId_idx" ON "rehabilitations"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "assistiveTypes_code_key" ON "assistiveTypes"("code");

-- CreateIndex
CREATE INDEX "assistiveTypes_groupId_idx" ON "assistiveTypes"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "assistiveDevices_code_key" ON "assistiveDevices"("code");

-- CreateIndex
CREATE INDEX "assistiveDevices_typeId_idx" ON "assistiveDevices"("typeId");

-- AddForeignKey
ALTER TABLE "rehabTypes" ADD CONSTRAINT "rehabTypes_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "rehabGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rehabilitations" ADD CONSTRAINT "rehabilitations_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "rehabTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistiveTypes" ADD CONSTRAINT "assistiveTypes_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "assistiveGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistiveDevices" ADD CONSTRAINT "assistiveDevices_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "assistiveTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

