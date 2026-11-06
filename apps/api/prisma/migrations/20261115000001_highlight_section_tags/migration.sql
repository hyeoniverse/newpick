-- 스크랩한 소식의 태그: 뉴스레터 태그 중 그 소식 글에 나오는 것. 소식 제목 · 사진처럼 스크랩할 때 한 번 꺼내 둔다
ALTER TABLE `highlights` ADD COLUMN `sectionTags` JSON NULL;
