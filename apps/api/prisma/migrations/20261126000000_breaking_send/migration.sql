-- 속보 메일 (속보 뉴스레터 2단계): 받기 설정 · 보낸 기록
ALTER TABLE `users`
    ADD COLUMN `breakingMail` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `breakingNight` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `breaking_alerts`
    ADD COLUMN `sentAt` DATETIME(3) NULL,
    ADD COLUMN `recipients` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `nightPending` BOOLEAN NOT NULL DEFAULT false;
