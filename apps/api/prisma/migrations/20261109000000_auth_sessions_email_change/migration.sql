-- 로그인은 Google 계정 ID로 찾는다 (이메일을 바꿔도 같은 계정). 예전 사용자는 다음 로그인 때 채운다
ALTER TABLE `users` ADD COLUMN `googleSub` VARCHAR(64) NULL;
CREATE UNIQUE INDEX `users_googleSub_key` ON `users`(`googleSub`);

-- 로그인 세션을 기기마다 한 줄로: userId 유일 조건을 풀고, 토큰 원문 대신 SHA-256을 둔다.
-- 지금 로그인한 사람은 그대로 이어지게 기존 토큰을 해시로 옮긴다
CREATE INDEX `oauth_tokens_userId_idx` ON `oauth_tokens`(`userId`);
DROP INDEX `oauth_tokens_userId_key` ON `oauth_tokens`;
ALTER TABLE `oauth_tokens`
    ADD COLUMN `tokenHash` CHAR(64) NULL,
    ADD COLUMN `prevHash` CHAR(64) NULL,
    ADD COLUMN `rotatedAt` DATETIME(3) NULL;
UPDATE `oauth_tokens` SET `tokenHash` = SHA2(`refreshToken`, 256);
ALTER TABLE `oauth_tokens` MODIFY `tokenHash` CHAR(64) NOT NULL, DROP COLUMN `refreshToken`;
CREATE UNIQUE INDEX `oauth_tokens_tokenHash_key` ON `oauth_tokens`(`tokenHash`);
CREATE INDEX `oauth_tokens_prevHash_idx` ON `oauth_tokens`(`prevHash`);

-- 이메일 바꾸기: 새 주소로 보낸 인증 코드
CREATE TABLE `email_changes` (
    `userId` INTEGER NOT NULL,
    `newEmail` VARCHAR(191) NOT NULL,
    `codeHash` CHAR(64) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `email_changes` ADD CONSTRAINT `email_changes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
