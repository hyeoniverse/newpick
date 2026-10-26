/**
 * 상태별 오류 화면 문구. 무엇이 잘못됐는지보다 "다음에 무엇을 하면 되는지"를 먼저 알려 준다.
 * action: 첫 번째(주) 버튼이 하는 일. 두 번째 버튼은 늘 홈으로
 */
export type ErrorAction = 'home' | 'retry' | 'login' | 'back' | 'articles';
export type ErrorIcon = 'search' | 'lock' | 'ban' | 'clock' | 'server' | 'tool' | 'alert' | 'deleted';

export interface ErrorStateCopy {
	icon: ErrorIcon;
	title: string;
	description: string;
	action: ErrorAction;
}

export const ERROR_STATES: Record<number, ErrorStateCopy> = {
	400: {
		icon: 'alert',
		title: '요청을 이해하지 못했어요',
		description: '주소가 잘못되었거나 입력값에 문제가 있어요. 다시 시도해 주세요.',
		action: 'retry',
	},
	401: {
		icon: 'lock',
		title: '로그인이 필요해요',
		description: '로그인하면 이 화면을 볼 수 있어요.',
		action: 'login',
	},
	403: {
		icon: 'ban',
		title: '볼 수 있는 권한이 없어요',
		description: '이 화면은 권한이 있는 계정만 볼 수 있어요.',
		action: 'back',
	},
	404: {
		icon: 'search',
		title: '페이지를 찾을 수 없어요',
		description: '주소가 바뀌었거나 없어진 페이지예요. 주소를 다시 확인해 주세요.',
		action: 'articles',
	},
	408: {
		icon: 'clock',
		title: '응답이 너무 늦어요',
		description: '연결이 느려 시간이 초과되었어요. 잠시 뒤 다시 시도해 주세요.',
		action: 'retry',
	},
	429: {
		icon: 'clock',
		title: '요청이 너무 많아요',
		description: '짧은 시간에 요청이 많이 들어왔어요. 1분쯤 뒤에 다시 시도해 주세요.',
		action: 'retry',
	},
	500: {
		icon: 'server',
		title: '일시적인 오류가 생겼어요',
		description: '서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요. 계속되면 아래 문의처로 알려 주세요.',
		action: 'retry',
	},
	502: {
		icon: 'server',
		title: '서버와 연결하지 못했어요',
		description: '잠시 뒤 다시 시도해 주세요.',
		action: 'retry',
	},
	503: {
		icon: 'tool',
		title: '잠시 점검 중이에요',
		description: '더 나은 서비스를 위해 점검하고 있어요. 잠시 뒤 다시 들러 주세요.',
		action: 'retry',
	},
	504: {
		icon: 'clock',
		title: '서버 응답이 늦어요',
		description: '잠시 뒤 다시 시도해 주세요.',
		action: 'retry',
	},
};

/** 지운 뉴스레터 주소로 들어왔을 때 */
export const DELETED_NEWSLETTER: ErrorStateCopy = {
	icon: 'deleted',
	title: '삭제되었거나 없는 뉴스레터예요',
	description: '뉴스레터가 내려갔거나 주소가 잘못되었어요. 다른 뉴스레터를 둘러보세요.',
	action: 'articles',
};

/** 표에 없는 코드는 같은 백의 대표 코드로 (예: 418 → 400, 507 → 500) */
export const errorStateFor = (status: number): ErrorStateCopy =>
	ERROR_STATES[status] ?? ERROR_STATES[status >= 500 ? 500 : 400];

/** 오류 객체에서 HTTP 상태 찾기. ApiError는 status를, 그 밖에는 메시지 속 세 자리 숫자를 본다 */
export const statusOf = (error: unknown): number => {
	if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') return error.status;
	const match = error instanceof Error ? error.message.match(/\b([45]\d{2})\b/) : null;
	return match ? Number(match[1]) : 500;
};
