import { CATEGORY_NAMES } from '@newpick/shared';
import { MysqlPrismaService } from '../prisma/mysql.service';

const prisma = new MysqlPrismaService();

async function generateCategory() {
  // 분야 목록은 @newpick/shared (웹과 같은 목록)
  const categories = CATEGORY_NAMES;

  for (const category of categories) {
    await prisma.newsCategory.upsert({
      where: { name: category },
      update: {},
      create: {
        name: category,
      },
    });
  }

  console.log(
    `데이터베이스에 ${categories.length}개의 카테고리가 자동으로 설정됩니다.`,
  );
}

generateCategory();
