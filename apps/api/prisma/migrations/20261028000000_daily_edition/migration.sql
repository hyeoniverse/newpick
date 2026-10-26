-- 하루 한 번 편집한 결과 (#55)
CREATE TABLE `daily_editions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` VARCHAR(10) NOT NULL,
    `newsletterIds` JSON NOT NULL,
    `editorial` JSON NULL,
    `token` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `daily_editions_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 구독 메일은 매일 보낸다 (7: 매일). 관리자가 저장해 둔 주기도 매일로
ALTER TABLE `schedule_configs` ALTER COLUMN `day` SET DEFAULT 7;
UPDATE `schedule_configs` SET `day` = 7;
