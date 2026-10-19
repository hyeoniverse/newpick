-- 코드에서 쓰지 않던 재시도 큐 테이블. 메일 재시도는 MailService 안에서 처리합니다.
-- DropForeignKey
ALTER TABLE `retry_queues` DROP FOREIGN KEY `retry_queues_userId_fkey`;

-- DropTable
DROP TABLE `retry_queues`;

