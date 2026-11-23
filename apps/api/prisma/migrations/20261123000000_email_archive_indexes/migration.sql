-- 받은 메일 기록을 주소 · 날짜로 찾는 조회가 늘 표 전체를 읽었다 (#341). 오늘 이미 받았는지 확인도 이 인덱스를 쓴다
CREATE INDEX `email_archives_email_sentAt_idx` ON `email_archives`(`email`, `sentAt`);
CREATE INDEX `email_archives_sentAt_idx` ON `email_archives`(`sentAt`);
