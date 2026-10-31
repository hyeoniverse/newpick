-- 메일 링크 클릭 (#123 15): 누가 눌렀는지는 남기지 않는다 (메일 날짜 · 맞춤 메일인지 · 링크 종류만)
CREATE TABLE `mail_clicks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `day` VARCHAR(10) NOT NULL,
    `personal` BOOLEAN NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mail_clicks_day_idx`(`day`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
