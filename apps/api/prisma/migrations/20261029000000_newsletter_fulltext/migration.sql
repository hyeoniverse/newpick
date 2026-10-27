-- 지난 뉴스레터 검색 (#20). 제목 · 부제 · 본문 FULLTEXT 인덱스.
-- 한국어는 띄어쓰기로 낱말이 나뉘지 않아 ngram 파서(기본 2글자 단위)로 나눈다. 그래서 검색어도 2글자 이상
ALTER TABLE `newsletters` ADD FULLTEXT INDEX `newsletters_search_idx` (`title`, `subtitle`, `content`) WITH PARSER ngram;
