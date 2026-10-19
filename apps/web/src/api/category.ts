import API_ENDPOINTS from '@/constants/api';
import { apiFetch } from '@/api/client';
import { Category } from '@/models/category.model';

/** 백엔드 공통 응답 형식({ data })과 배열 응답 모두 올 수 있습니다. */
type CategoryResponse = { data: Category[] } | Category[];

export const fetchCategories = async () => apiFetch<CategoryResponse>(API_ENDPOINTS.CATEGORY.BASE);

export const fetchCategory = async (id: string) => apiFetch<{ data: Category }>(API_ENDPOINTS.CATEGORY.GET_BY_ID(id));
