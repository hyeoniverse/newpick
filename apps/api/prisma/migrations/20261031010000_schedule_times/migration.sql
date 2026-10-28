-- 예약 작업 시간을 관리자 화면에서 바꾼다 (#21). 기존 hour · day는 구독 메일의 시 · 요일
-- 기본값은 지금 시간 그대로: 수집 08:00, AI 요약 08:30, 메일 08:40
ALTER TABLE `schedule_configs`
    ADD COLUMN `crawlHour` INTEGER NOT NULL DEFAULT 8,
    ADD COLUMN `crawlMinute` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `summaryHour` INTEGER NOT NULL DEFAULT 8,
    ADD COLUMN `summaryMinute` INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN `mailMinute` INTEGER NOT NULL DEFAULT 40;
