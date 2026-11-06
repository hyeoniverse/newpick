-- 요약 기록의 분야: 실패한 분야를 다시 시도해 성공했는지 관리자 AI 기록에서 잇는다. 이전 기록은 NULL
ALTER TABLE `ai_process_logs` ADD COLUMN `categoryId` INTEGER NULL;
CREATE INDEX `ai_process_logs_categoryId_createdAt_idx` ON `ai_process_logs`(`categoryId`, `createdAt`);
