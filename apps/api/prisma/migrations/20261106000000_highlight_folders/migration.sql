-- 스크랩 폴더 (#123)
CREATE TABLE `highlight_folders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `highlight_folders_userId_name_key`(`userId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `highlight_folders` ADD CONSTRAINT `highlight_folders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `highlights` ADD COLUMN `folderId` INTEGER NULL;
CREATE INDEX `highlights_folderId_idx` ON `highlights`(`folderId`);
ALTER TABLE `highlights` ADD CONSTRAINT `highlights_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `highlight_folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
