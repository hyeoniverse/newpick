-- 폴더를 스크랩 · 북마크 · 받은 메일 공통으로 (#123)
RENAME TABLE `highlight_folders` TO `folders`;
ALTER TABLE `folders` DROP FOREIGN KEY `highlight_folders_userId_fkey`;
ALTER TABLE `folders` RENAME INDEX `highlight_folders_userId_name_key` TO `folders_userId_name_key`;
ALTER TABLE `folders` ADD CONSTRAINT `folders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 북마크 폴더
ALTER TABLE `bookmarks` ADD COLUMN `folderId` INTEGER NULL;
CREATE INDEX `bookmarks_folderId_idx` ON `bookmarks`(`folderId`);
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 받은 메일 표시: 중요 · 폴더
CREATE TABLE `mail_marks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `sentAt` DATETIME(3) NOT NULL,
    `starred` BOOLEAN NOT NULL DEFAULT false,
    `folderId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mail_marks_folderId_idx`(`folderId`),
    UNIQUE INDEX `mail_marks_userId_sentAt_key`(`userId`, `sentAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `mail_marks` ADD CONSTRAINT `mail_marks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mail_marks` ADD CONSTRAINT `mail_marks_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
