/** 뉴스레터 목록 · 상세 · 검색 */
export const ARTICLES = {
	loadMoreFailed: '뉴스레터를 더 불러오지 못했습니다.',
	searchEmpty: {
		title: '검색 결과가 없습니다',
		body: '검색어를 바꾸거나 기간 · 관심사 조건을 넓혀 주십시오.',
	},
	popularNone: '아직 인기 뉴스레터가 없습니다.',
	popularLoadFailed: '인기 뉴스레터를 불러오지 못했습니다.',
	noPrev: '이전글이 없습니다.',
	noNext: '다음글이 없습니다.',
	aiNotice:
		'이 뉴스레터는 AI가 여러 언론사 기사를 요약·재구성한 글입니다. 수치와 발언은 각 소식의 출처 기사에서 함께 확인해 주십시오.',
	categoryLead: (description: string) => `${description}을 매일 아침 정리합니다.`,
	searchMin: '2글자 이상 입력해 주십시오.',
	linkCopied: '주소가 복사되었습니다.',
	linkCopyFailed: '주소를 복사하지 못했습니다.',
};
