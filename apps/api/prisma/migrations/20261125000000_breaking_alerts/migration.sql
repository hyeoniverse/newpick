-- 속보 후보: 매시 수집 뒤 판정한 것. 취소할 시간(5분) 뒤 저절로 보내고, 그 사이 관리자가 막을 수 있다
CREATE TABLE `breaking_alerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(16) NOT NULL DEFAULT 'scheduled',
    `score` INTEGER NOT NULL,
    `headline` VARCHAR(200) NOT NULL,
    `reason` TEXT NOT NULL,
    `articles` JSON NOT NULL,
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sendAt` DATETIME(3) NULL,
    `decidedAt` DATETIME(3) NULL,
    `decidedBy` INTEGER NULL,

    INDEX `breaking_alerts_detectedAt_idx`(`detectedAt`),
    INDEX `breaking_alerts_status_sendAt_idx`(`status`, `sendAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 속보 자동 발송 스위치 (관리자 › 속보). 끄면 새 후보는 모두 보류로 남는다
ALTER TABLE `schedule_configs` ADD COLUMN `breakingAuto` BOOLEAN NOT NULL DEFAULT true;
