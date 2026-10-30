-- 로그인한 기기 보기 (마이페이지): 어떤 브라우저인지 · 마지막으로 쓴 때
ALTER TABLE `oauth_tokens`
    ADD COLUMN `userAgent` VARCHAR(255) NULL,
    ADD COLUMN `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
