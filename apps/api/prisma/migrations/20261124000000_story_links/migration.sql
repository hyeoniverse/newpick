-- 이어지는 이야기: 소식 임베딩(후속 판정과 함께 씀)과, 소식이 며칠 전 어느 소식의 새 진전인지
CREATE TABLE `story_vectors` (
    `newsletterId` INTEGER NOT NULL,
    `storyIndex` INTEGER NOT NULL,
    `heading` VARCHAR(200) NOT NULL,
    `vector` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`newsletterId`, `storyIndex`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `story_links` (
    `newsletterId` INTEGER NOT NULL,
    `storyIndex` INTEGER NOT NULL,
    `prevNewsletterId` INTEGER NOT NULL,
    `prevStoryIndex` INTEGER NOT NULL,
    `reason` VARCHAR(300) NOT NULL,
    `score` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `story_links_prevNewsletterId_idx`(`prevNewsletterId`),
    PRIMARY KEY (`newsletterId`, `storyIndex`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `story_vectors` ADD CONSTRAINT `story_vectors_newsletterId_fkey` FOREIGN KEY (`newsletterId`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `story_links` ADD CONSTRAINT `story_links_newsletterId_fkey` FOREIGN KEY (`newsletterId`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `story_links` ADD CONSTRAINT `story_links_prevNewsletterId_fkey` FOREIGN KEY (`prevNewsletterId`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
