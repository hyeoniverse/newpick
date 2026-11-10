/** 약관 · 개인정보 처리방침 문서의 짜임 (content/legal.ts가 채우고 LegalDocument가 그린다) */

/** 문단: 글자, 목록, 표 */
export type LegalBlock = string | { list: string[] } | { table: { head: string[]; rows: string[][] } };
export type LegalSection = { title: string; blocks: LegalBlock[] };

/** 한눈에 보기 카드 (개인정보 처리방침 작성지침의 "주요 처리 사항" 요약) */
export type LegalSummary = {
	icon: 'collect' | 'purpose' | 'period' | 'share' | 'global' | 'contact' | 'free' | 'ai' | 'mail';
	title: string;
	text: string;
};
