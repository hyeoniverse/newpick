-- 맞춤 메일 계획 (#123 3단계): 취향으로 앞당긴 소식 · 더한 다른 분야 소식 (받은 그대로 다시 만들기용)
CREATE TABLE `mail_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL,
    `plan` JSON NOT NULL,

    UNIQUE INDEX `mail_plans_email_sentAt_key`(`email`, `sentAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
