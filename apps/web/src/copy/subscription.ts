/** 구독 시작 · 일시정지 · 해지 */
export const SUBSCRIPTION = {
	done: {
		title: '구독 설정이 완료되었습니다',
		body: '내일부터 새로운 뉴스레터를 보내 드립니다.',
	},
	sheetDone: {
		title: '구독이 완료되었습니다',
		body: '내일 아침부터 선택한 분야의 뉴스레터를 보내 드립니다.',
	},
	sheetLead: '받아 볼 분야를 고르면 주요 소식만 추려 메일로 보내 드립니다.',
	pickCategory: '분야를 골라 주십시오',
	already: {
		title: '이미 구독 중입니다',
		body: '구독 중인 뉴스레터가 있습니다.',
	},
	notSubscribed: {
		title: '구독 상태가 아닙니다',
		body: '뉴스레터를 구독하시겠습니까?\n확인을 누르면 구독 설정으로 이동합니다.',
		status: '구독 상태가 아닙니다.',
	},
	cancelConfirm: {
		title: '정말로 해지하시겠습니까?',
		body: '구독을 해지하면 구독과 관련된\n모든 정보가 삭제됩니다.',
	},
	pickThenDone: '구독할 관심사를 고른 뒤 완료를 눌러 주십시오.',
	appliesTomorrow: '내일 보내 드리는 뉴스레터부터 적용됩니다.',
	started: '구독이 완료되었습니다.',
	startFailed: '구독 중 오류가 발생했습니다. 다시 시도해 주십시오.',
	paused: '구독이 일시정지되었습니다.',
	pauseFailed: '구독 일시정지 중 오류가 발생했습니다. 다시 시도해 주십시오.',
	cancelled: '구독이 해지되었습니다.',
	cancelFailed: '구독 해지 중 오류가 발생했습니다. 다시 시도해 주십시오.',
	interestsFailed: '관심사 변경 중 오류가 발생했습니다. 다시 시도해 주십시오.',
	loginRequired: '로그인이 필요합니다.',
	userLoadFailed: '로그인 정보를 불러올 수 없습니다.',
	pickOneOrMore: '관심사를 한 개 이상 선택해 주십시오.',
	agreeRequired: '약관에 동의해야 구독할 수 있습니다.',
	agree: '에 동의합니다.',
	agreed: '에 동의했습니다.',
};
