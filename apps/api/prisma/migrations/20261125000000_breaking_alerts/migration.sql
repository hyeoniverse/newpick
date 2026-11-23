-- 속보 후보: 매시 수집 뒤 판정한 것. 관리자가 확인한 뒤에만 속보 뉴스레터로 만들어 보낸다
CREATE TABLE `breaking_alerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(16) NOT NULL DEFAULT 'pending',
    `score` INTEGER NOT NULL,
    `headline` VARCHAR(200) NOT NULL,
    `reason` TEXT NOT NULL,
    `articles` JSON NOT NULL,
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decidedAt` DATETIME(3) NULL,
    `decidedBy` INTEGER NULL,

    INDEX `breaking_alerts_detectedAt_idx`(`detectedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
