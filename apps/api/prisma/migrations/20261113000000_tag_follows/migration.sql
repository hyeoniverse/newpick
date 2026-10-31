-- 태그 팔로우 (#123 5단계): 사용자가 직접 고른 관심 태그. 맞춤 메일 · 추천 기사에 가장 강한 신호로 쓴다
CREATE TABLE `tag_follows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tag` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tag_follows_userId_tag_key`(`userId`, `tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tag_follows` ADD CONSTRAINT `tag_follows_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
