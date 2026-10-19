-- 뉴스 카테고리 기준 데이터.
-- 프론트(apps/web/src/constants/categories.ts)가 id 1~6을 고정으로 사용하므로 id를 명시합니다.
INSERT INTO `news_categories` (`id`, `name`) VALUES
  (1, 'IT'),
  (2, '정치'),
  (3, '경제'),
  (4, '사회'),
  (5, '생활'),
  (6, '세계')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
