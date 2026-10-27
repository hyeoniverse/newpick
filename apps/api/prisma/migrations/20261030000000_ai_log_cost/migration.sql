-- AI 기록에 모델 · 입력/출력 토큰 · 비용(USD) (#21 관리자 대시보드). 이전 기록은 비어 있음(비용 모름)
ALTER TABLE `ai_process_logs`
    ADD COLUMN `model` VARCHAR(191) NULL,
    ADD COLUMN `inputTokens` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `outputTokens` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `costUsd` DOUBLE NULL;
