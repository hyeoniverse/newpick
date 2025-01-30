import API_ENDPOINTS from '@/constants/api';
import { notFound } from 'next/navigation';

export const fetchArticleList = async (limit: number = 5, offset: number = 0) => {
  const response = await fetch(API_ENDPOINTS.NEWSLETTER.LIST(limit,offset));

  if (!response.ok) {
    throw new Error('아티클 리스트를 불러오는데 실패했습니다.');
  }

  return await response.json();
};

export const fetchArticle = async (slug: string) => {
  const response = await fetch(`${API_ENDPOINTS.NEWSLETTER.BASE}/${slug}`);

  if (!response.ok) {
    throw new Error('아티클을 불러오는데 실패했습니다.');
  }
  const data = await response.json();

  // 빈 데이터의 백엔드 전송 필요
  if (data.statusCode !== 200 || !data.data) {
    notFound();
  }

  return data.data;
}