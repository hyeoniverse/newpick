export const ERRORS = {
	AUTH: {
		POPUP_BLOCKED: '팝업 차단으로 인해 Google OAuth 창을 열 수 없습니다.',
		POPUP_CLOSED: 'OAuth 로그인 창이 닫혔습니다. 다시 시도해주세요.',
		FETCH_FAILED: '인증 오류가 발생했습니다.',
		OAUTH_FAILED: 'Google OAuth 로그인 실패.',
	},
	SUBSCRIBER: {
		START: '구독 시작에 실패했습니다.',
		END: '구독 종료에 실패했습니다.',
		STATUS: '구독 상태를 불러오는데 실패했습니다.',
		HISTORY: '구독 내역을 불러오는데 실패했습니다.',
	},
};

export const WARNS = {
	SUBSCRIBE: {
		START: '새로운 뉴스레터 구독을 시작하시겠습니까?',
		RESTART: '뉴스레터 구독이 일시정지 중 입니다. 구독을 다시 시작하시겠습니까?',
		END: '뉴스레터 구독을 종료하시겠습니까?',
		ALREADY: '이미 구독 중입니다.',
	},
};
