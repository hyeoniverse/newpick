import API_ENDPOINTS from '@/constants/api';

export const fetchCategories = async () => {
  const response = await fetch(API_ENDPOINTS.CATEGORY.BASE, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`카테고리를 불러오는데 실패했습니다. ${response.status}`);
  }

  return response.json();
};

export const fetchCategory = async (id: string) => {
  const response = await fetch(API_ENDPOINTS.CATEGORY.GET_BY_ID(id), {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`카테고리를 불러오는데 실패했습니다. ${response.status}`);
  }

  return response.json();
};