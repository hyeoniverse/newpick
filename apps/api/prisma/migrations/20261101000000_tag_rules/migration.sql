-- 태그 규칙: 합치기(alias) · 지우기(block) (#20 태그 정돈)
CREATE TABLE `tag_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `keyword` VARCHAR(100) NOT NULL,
    `action` VARCHAR(10) NOT NULL,
    `target` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tag_rules_keyword_key`(`keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
