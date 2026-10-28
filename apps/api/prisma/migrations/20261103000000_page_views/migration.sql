-- 방문 통계 (#131): 쿠키 없이, 페이지 한 번 보기 = 한 줄
CREATE TABLE `page_views` (
    `id` VARCHAR(32) NOT NULL,
    `sessionId` VARCHAR(32) NOT NULL,
    `path` VARCHAR(255) NOT NULL,
    `route` VARCHAR(120) NOT NULL,
    `entry` BOOLEAN NOT NULL DEFAULT false,
    `channel` VARCHAR(20) NOT NULL,
    `referrerHost` VARCHAR(120) NULL,
    `utmSource` VARCHAR(100) NULL,
    `utmMedium` VARCHAR(100) NULL,
    `utmCampaign` VARCHAR(100) NULL,
    `device` VARCHAR(10) NOT NULL,
    `viewportW` INTEGER NOT NULL,
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `scrollDepth` INTEGER NOT NULL DEFAULT 0,
    `sections` JSON NULL,
    `attention` JSON NULL,
    `clicks` JSON NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `page_views_startedAt_idx`(`startedAt`),
    INDEX `page_views_route_startedAt_idx`(`route`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
