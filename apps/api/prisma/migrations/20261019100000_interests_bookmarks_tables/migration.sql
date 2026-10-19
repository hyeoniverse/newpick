-- 관심사와 북마크를 FK로 연결된 테이블로 옮깁니다.
-- 순서: 새 테이블 생성 → 기존 데이터 복사 → 기존 컬럼·테이블 삭제

-- 1. 관심사: users.interests(JSON 배열) → user_interests
CREATE TABLE `user_interests` (
    `userId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_interests` ADD CONSTRAINT `user_interests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_interests` ADD CONSTRAINT `user_interests_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `news_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 존재하는 카테고리 id만 옮기고, 중복은 한 번만 넣습니다.
INSERT IGNORE INTO `user_interests` (`userId`, `categoryId`)
SELECT u.`id`, jt.`categoryId`
FROM `users` u
JOIN JSON_TABLE(
    IF(JSON_TYPE(u.`interests`) = 'ARRAY', u.`interests`, JSON_ARRAY()),
    '$[*]' COLUMNS (`categoryId` INTEGER PATH '$' NULL ON ERROR)
) jt
JOIN `news_categories` c ON c.`id` = jt.`categoryId`
WHERE u.`interests` IS NOT NULL;

-- 2. 북마크: feedbacks(likes = true) → bookmarks(userId, newsletterId)
-- 기존 bookmarks(title, url)는 코드에서 쓰지 않던 테이블이라 행을 옮길 수 없어 비웁니다.
DELETE FROM `bookmarks`;
ALTER TABLE `bookmarks` DROP COLUMN `title`,
    DROP COLUMN `url`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `newsletterId` INTEGER NOT NULL;
CREATE UNIQUE INDEX `bookmarks_userId_newsletterId_key` ON `bookmarks`(`userId`, `newsletterId`);
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_newsletterId_fkey` FOREIGN KEY (`newsletterId`) REFERENCES `newsletters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT IGNORE INTO `bookmarks` (`userId`, `newsletterId`, `createdAt`)
SELECT f.`userId`, f.`newsletterId`, MIN(f.`createdAt`)
FROM `feedbacks` f
WHERE f.`likes` = true AND f.`newsletterId` IS NOT NULL
GROUP BY f.`userId`, f.`newsletterId`;

-- 3. 더 이상 쓰지 않는 컬럼과 테이블 삭제
ALTER TABLE `feedbacks` DROP FOREIGN KEY `feedbacks_userId_fkey`;
ALTER TABLE `feedbacks` DROP FOREIGN KEY `feedbacks_newsletterId_fkey`;
DROP TABLE `feedbacks`;

-- password: 로컬 로그인이 없어 Google sub를 넣어 두던 컬럼
ALTER TABLE `users` DROP COLUMN `interests`,
    DROP COLUMN `password`;

-- accessToken: 항상 빈 문자열로 저장되던 컬럼 (access token은 쿠키로만 전달)
ALTER TABLE `oauth_tokens` DROP COLUMN `accessToken`;
