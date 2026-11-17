/** 취향 타입 (#199에서 edition/personalize · taste.service에서 떼어 냄). 맞춤 메일 · 추천 기사가 같이 쓴다 */

/** 취향 신호 하나: 북마크한 소식(제목 · 리드) 또는 스크랩한 문장(+메모)의 임베딩 */
export type TasteSignal = {
	kind: 'bookmark' | 'scrap';
	/** 소식 제목 · 스크랩 문장 앞부분 (이미 본 소식을 알아보는 데 쓴다) */
	label: string;
	vector: number[];
};

/** 한 사람의 취향: 점수 큰 태그 (이름 · 비교 열쇠 · 점수)와 신호 임베딩 */
export type TasteProfile = {
	topics: { name: string; key: string; score: number }[];
	signals?: TasteSignal[];
};

/** 임베딩할 신호 글 */
export type SignalText = Omit<TasteSignal, 'vector'> & { text: string };
