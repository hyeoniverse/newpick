-- 후속 지켜보기: 소식 하나를 지켜보고, 이어지는 새 소식이 나오면 쌓는다
CREATE TABLE `story_follows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `newsletterId` INTEGER NOT NULL,
    `storyIndex` INTEGER NOT NULL,
    `heading` VARCHAR(200) NOT NULL,
    `text` TEXT NOT NULL,
    `embedding` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `story_follows_newsletterId_idx`(`newsletterId`),
    UNIQUE INDEX `story_follows_userId_newsletterId_storyIndex_key`(`userId`, `newsletterId`, `storyIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `follow_updates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `followId` INTEGER NOT NULL,
    `newsletterId` INTEGER NOT NULL,
    `storyIndex` INTEGER NOT NULL,
    `heading` VARCHAR(200) NOT NULL,
    `reason` VARCHAR(300) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `seenAt` DATETIME(3) NULL,

    UNIQUE INDEX `follow_updates_followId_newsletterId_storyIndex_key`(`followId`, `newsletterId`, `storyIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `story_follows` ADD CONSTRAINT `story_follows_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `story_follows` ADD CONSTRAINT `story_follows_newsletterId_fkey` FOREIGN KEY (`newsletterId`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `follow_updates` ADD CONSTRAINT `follow_updates_followId_fkey` FOREIGN KEY (`followId`) REFERENCES `story_follows`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `follow_updates` ADD CONSTRAINT `follow_updates_newsletterId_fkey` FOREIGN KEY (`newsletterId`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
