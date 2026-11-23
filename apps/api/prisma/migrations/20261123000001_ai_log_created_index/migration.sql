-- 대시보드 · 통계가 기간(createdAt)만으로 AI 기록을 찾는데 (categoryId, createdAt) 인덱스만 있었다 (#341)
CREATE INDEX `ai_process_logs_createdAt_idx` ON `ai_process_logs`(`createdAt`);
