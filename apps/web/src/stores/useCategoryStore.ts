import { create } from 'zustand';
import { fetchCategories } from '@/api/category';
import { Category } from '@/models/category.model';

interface CategoryStore {
  categories: Record<number, string>;
  fetchCategories: () => Promise<void>;
  getCategoryName: (id: number) => string;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: {},
  fetchCategories: async () => {
    try {
      const response = await fetchCategories();
      // 응답 구조에 맞게 배열을 추출합니다.
      // 예를 들어, 응답이 { data: [...] } 형태라면:
      const dataArray: Category[] = response.data || response; // response.data가 없으면 response 자체가 배열일 수 있음
      if (!Array.isArray(dataArray)) {
        throw new Error('Invalid categories data structure');
      }
      const catMap: Record<number, string> = {};
      dataArray.forEach((cat) => {
        catMap[cat.id] = cat.name;
      });
      set({ categories: catMap });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },
  getCategoryName: (id: number) => {
    const { categories } = get();
    return categories[id] || `#${id}`;
  },
}));
