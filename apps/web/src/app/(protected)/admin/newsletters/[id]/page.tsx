import type { Metadata } from 'next';
import NewsletterEdit from '@/app/(protected)/admin/_components/NewsletterEdit';

export const metadata: Metadata = {
	title: '관리자 · 뉴스레터 고치기',
	robots: { index: false, follow: false },
};

/** 관리자 CMS (#31): 뉴스레터 한 편 고치기 — 제목 · 부제 · 요약 · 키워드 · 관심사 · 본문 HTML */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <NewsletterEdit id={Number(id)} />;
}
