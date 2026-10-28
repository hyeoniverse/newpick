-- 관리자 통계 (#122)

-- AI 기록: 호출별 사용량 (고르기 · 쓰기를 나눠 모델 · 단계별 비용을 본다)
ALTER TABLE `ai_process_logs` ADD COLUMN `calls` JSON NULL;

-- 구독 기록
CREATE TABLE `subscription_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(10) NOT NULL,
    `interests` JSON NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `backfilled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subscription_events_at_idx`(`at`),
    INDEX `subscription_events_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 지금 구독 상태로 기록을 채운다 (과거 해지 · 재구독 · 일시정지 시각은 남아 있지 않아 추정):
-- 모두 마지막 구독 시작(startedAt)에 subscribe, 해지한 사람은 endAt에 cancel,
-- 일시정지 중인 사람은 시각을 몰라 구독 시작과 같은 때 pause
INSERT INTO `subscription_events` (`userId`, `type`, `interests`, `at`, `backfilled`)
SELECT s.`userId`, 'subscribe',
       (SELECT JSON_ARRAYAGG(ui.`categoryId`) FROM `user_interests` ui WHERE ui.`userId` = s.`userId`),
       s.`startedAt`, true
FROM `subscribers` s;

INSERT INTO `subscription_events` (`userId`, `type`, `interests`, `at`, `backfilled`)
SELECT s.`userId`, 'cancel', NULL, s.`endAt`, true
FROM `subscribers` s
WHERE s.`status` = 'cancelled' AND s.`endAt` IS NOT NULL;

INSERT INTO `subscription_events` (`userId`, `type`, `interests`, `at`, `backfilled`)
SELECT s.`userId`, 'pause', NULL, s.`startedAt`, true
FROM `subscribers` s
WHERE s.`status` = 'paused';
