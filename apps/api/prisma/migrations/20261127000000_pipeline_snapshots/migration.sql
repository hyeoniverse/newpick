-- 홈 '지금 뉴픽은': 마지막 수집 · 뉴스레터 만들기 과정 (kind마다 한 행)
CREATE TABLE `pipeline_snapshots` (
    `kind` VARCHAR(16) NOT NULL,
    `data` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`kind`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
