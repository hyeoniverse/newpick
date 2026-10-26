-- 뉴스레터 키워드, 문자열 배열 (#50). 이전 뉴스레터는 NULL
ALTER TABLE `newsletters` ADD COLUMN `keywords` JSON NULL;
