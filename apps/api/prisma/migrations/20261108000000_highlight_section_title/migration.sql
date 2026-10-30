-- 스크랩한 소식(story-N)의 제목을 꺼내 둔다 (목록마다 본문을 읽지 않게). 예전 스크랩은 null로 두고 처음 볼 때 채운다
ALTER TABLE `highlights` ADD COLUMN `sectionTitle` VARCHAR(200) NULL;
