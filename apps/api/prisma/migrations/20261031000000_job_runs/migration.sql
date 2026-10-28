-- 예약 작업 실행 기록 (#21 관리자 대시보드). 서버를 다시 시작해도 남는다
CREATE TABLE `job_runs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `job` VARCHAR(20) NOT NULL,
    `trigger` VARCHAR(20) NOT NULL DEFAULT 'schedule',
    `status` VARCHAR(20) NOT NULL,
    `message` TEXT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NULL,
    `durationMs` INTEGER NULL,

    INDEX `job_runs_startedAt_idx`(`startedAt`),
    INDEX `job_runs_job_startedAt_idx`(`job`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
