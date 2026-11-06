-- 스크랩한 소식의 사진: 소식 제목처럼 스크랩할 때 한 번 꺼내 둔다 (마이페이지 블록을 소식 단위로, 목록마다 본문을 읽지 않게)
ALTER TABLE `highlights` ADD COLUMN `sectionImage` VARCHAR(500) NULL;
