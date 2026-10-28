-- 스크랩 · 메모 (#123 1단계)
CREATE TABLE `highlights` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `newsletterId` INTEGER NOT NULL,
    `section` VARCHAR(40) NULL,
    `text` VARCHAR(500) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `highlights_userId_newsletterId_text_key`(`userId`, `newsletterId`, `text`),
    INDEX `highlights_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `highlights` ADD CONSTRAINT `highlights_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `highlights` ADD CONSTRAINT `highlights_newsletterId_fkey` FOREIGN KEY (`newsletterId`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
