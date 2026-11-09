/**
 * 뉴스레터 분야. id는 DB news_categories의 id와 같다 (migration 20261019000001_seed_categories).
 * 웹의 '전체'(id 0)는 화면용이라 여기에 없다
 */
export const CATEGORIES = [
  { id: 1, name: 'IT', description: 'AI·반도체·플랫폼·보안 소식' },
  { id: 2, name: '정치', description: '국회·정부·선거와 정책 결정' },
  { id: 3, name: '경제', description: '증시·금리·부동산·산업 흐름' },
  { id: 4, name: '사회', description: '사건·사고·노동·교육 이슈' },
  { id: 5, name: '생활', description: '건강·날씨·소비·문화 소식' },
  { id: 6, name: '세계', description: '국제 정세·외교·분쟁 소식' },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategoryId = Category['id'];
export type CategoryName = Category['name'];

export const CATEGORY_NAMES: readonly CategoryName[] = CATEGORIES.map((c) => c.name);

/** id → 이름 (없는 id면 undefined) */
export const categoryName = (id: number): CategoryName | undefined =>
  CATEGORIES.find((c) => c.id === id)?.name;
