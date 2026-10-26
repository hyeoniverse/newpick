-- 뉴스레터 부제목 (#42). 이전 뉴스레터는 NULL
ALTER TABLE `newsletters` ADD COLUMN `subtitle` VARCHAR(191) NULL;
