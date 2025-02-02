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
      const dataArray: Category[] = response.data || response;
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
