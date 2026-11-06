-- 후속 지켜보기: 오래 조용한 소식에 '계속 지켜보기'를 누른 때 (그때부터 다시 센다)
ALTER TABLE `story_follows` ADD COLUMN `keptAt` DATETIME(3) NULL;
