-- 사진이 깨질 때 대신 보일 사진 (키워드로 Pexels에서 찾음). 이전 뉴스레터는 NULL로 두고 매시 수집 뒤 조금씩 채운다
ALTER TABLE `newsletters` ADD COLUMN `fallbackImageUrl` TEXT NULL;
