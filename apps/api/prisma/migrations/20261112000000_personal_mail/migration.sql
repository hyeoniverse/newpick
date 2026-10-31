-- 맞춤 메일 끄기 (#123 16): 끄면 구독한 분야의 뉴스레터를 분야별로 받는다
ALTER TABLE `users` ADD COLUMN `personalMail` BOOLEAN NOT NULL DEFAULT true;
