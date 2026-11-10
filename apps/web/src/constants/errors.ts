/**
 * 상태별 오류 화면 문구. 무엇이 잘못됐는지보다 "다음에 무엇을 하면 되는지"를 먼저 알려 준다.
 * action: 첫 번째(주) 버튼이 하는 일. 두 번째 버튼은 늘 홈으로
 */
export type ErrorAction = 'home' | 'retry' | 'login' | 'back' | 'articles';
export type ErrorIcon =
	'search' | 'lock' | 'ban' | 'clock' | 'server' | 'tool' | 'alert' | 'deleted' | 'file' | 'refresh' | 'scale' | 'wifi';

export interface ErrorStateCopy {
	icon: ErrorIcon;
	title: string;
	description: string;
	action: ErrorAction;
}

const RETRY_LATER = '잠시 뒤 다시 시도해 주십시오.';

/**
 * HTTP 표준 4xx·5xx 전부. 3xx(301·302·303·307·308)는 오류가 아니라 다른 주소로 옮기라는 응답이라
 * 브라우저가 알아서 따라가므로 화면이 없다. 1xx·2xx도 마찬가지
 */
export const ERROR_STATES: Record<number, ErrorStateCopy> = {
	400: {
		icon: 'alert',
		title: '요청을 이해하지 못했습니다',
		description: '주소가 잘못되었거나 입력값에 문제가 있습니다. 다시 시도해 주십시오.',
		action: 'retry',
	},
	401: {
		icon: 'lock',
		title: '로그인이 필요합니다',
		description: '로그인하면 이 화면을 볼 수 있습니다.',
		action: 'login',
	},
	402: {
		icon: 'lock',
		title: '이용할 수 없는 기능입니다',
		description: '지금은 제공하지 않는 기능입니다.',
		action: 'home',
	},
	403: {
		icon: 'ban',
		title: '볼 수 있는 권한이 없습니다',
		description: '이 화면은 권한이 있는 계정만 볼 수 있습니다.',
		action: 'back',
	},
	404: {
		icon: 'search',
		title: '페이지를 찾을 수 없습니다',
		description: '주소가 바뀌었거나 없어진 페이지입니다. 주소를 다시 확인해 주십시오.',
		action: 'articles',
	},
	405: {
		icon: 'alert',
		title: '할 수 없는 요청입니다',
		description: '이 화면에서는 지원하지 않는 방식의 요청입니다.',
		action: 'back',
	},
	406: {
		icon: 'alert',
		title: '보여 드릴 수 없는 형식입니다',
		description: '요청한 형식으로는 내용을 보여 드릴 수 없습니다.',
		action: 'back',
	},
	407: {
		icon: 'wifi',
		title: '네트워크 인증이 필요합니다',
		description: '사용 중인 네트워크(프록시)에 먼저 로그인해 주십시오.',
		action: 'retry',
	},
	408: {
		icon: 'clock',
		title: '응답이 너무 늦습니다',
		description: `연결이 느려 시간이 초과되었습니다. ${RETRY_LATER}`,
		action: 'retry',
	},
	409: {
		icon: 'refresh',
		title: '다른 곳에서 먼저 바뀌었습니다',
		description: '그 사이 내용이 바뀌었습니다. 새로 고친 뒤 다시 해 주십시오.',
		action: 'retry',
	},
	410: {
		icon: 'deleted',
		title: '삭제된 페이지입니다',
		description: '더 이상 제공하지 않는 페이지입니다. 다른 뉴스레터를 둘러보십시오.',
		action: 'articles',
	},
	411: {
		icon: 'alert',
		title: '요청을 이해하지 못했습니다',
		description: '요청에 필요한 정보가 빠졌습니다. 다시 시도해 주십시오.',
		action: 'retry',
	},
	412: {
		icon: 'refresh',
		title: '다른 곳에서 먼저 바뀌었습니다',
		description: '그 사이 내용이 바뀌었습니다. 새로 고친 뒤 다시 해 주십시오.',
		action: 'retry',
	},
	413: {
		icon: 'file',
		title: '보낸 내용이 너무 큽니다',
		description: '파일이나 글을 줄여서 다시 보내 주십시오.',
		action: 'back',
	},
	414: { icon: 'alert', title: '주소가 너무 깁니다', description: '주소를 다시 확인해 주십시오.', action: 'home' },
	415: {
		icon: 'file',
		title: '지원하지 않는 형식입니다',
		description: '다른 형식의 파일로 다시 시도해 주십시오.',
		action: 'back',
	},
	416: {
		icon: 'file',
		title: '요청한 범위를 찾을 수 없습니다',
		description: '처음부터 다시 시도해 주십시오.',
		action: 'retry',
	},
	417: { icon: 'alert', title: '요청을 처리할 수 없습니다', description: '다시 시도해 주십시오.', action: 'retry' },
	418: { icon: 'alert', title: '요청을 처리할 수 없습니다', description: '다시 시도해 주십시오.', action: 'retry' },
	421: { icon: 'server', title: '잘못된 서버로 연결됐습니다', description: `${RETRY_LATER}`, action: 'retry' },
	422: {
		icon: 'alert',
		title: '입력한 내용을 확인해 주십시오',
		description: '형식은 맞지만 처리할 수 없는 값이 있습니다.',
		action: 'back',
	},
	423: {
		icon: 'lock',
		title: '지금은 바꿀 수 없습니다',
		description: `다른 작업이 진행 중이라 잠겨 있습니다. ${RETRY_LATER}`,
		action: 'retry',
	},
	424: {
		icon: 'alert',
		title: '앞선 요청이 실패했습니다',
		description: '처음부터 다시 시도해 주십시오.',
		action: 'retry',
	},
	425: { icon: 'clock', title: '조금 이른 요청입니다', description: `${RETRY_LATER}`, action: 'retry' },
	426: {
		icon: 'refresh',
		title: '새 버전이 나왔습니다',
		description: '새로 고쳐서 최신 화면으로 이용해 주십시오.',
		action: 'retry',
	},
	428: {
		icon: 'refresh',
		title: '새로 고친 뒤 다시 해 주십시오',
		description: '최신 내용을 확인한 뒤에 바꿀 수 있습니다.',
		action: 'retry',
	},
	429: {
		icon: 'clock',
		title: '요청이 너무 많습니다',
		description: '짧은 시간에 요청이 많이 들어왔습니다. 1분쯤 뒤에 다시 시도해 주십시오.',
		action: 'retry',
	},
	431: {
		icon: 'alert',
		title: '브라우저에 저장된 정보가 너무 많습니다',
		description: '이 사이트의 쿠키를 지운 뒤 다시 들어와 주십시오.',
		action: 'home',
	},
	451: {
		icon: 'scale',
		title: '법적인 이유로 볼 수 없습니다',
		description: '권리자의 요청 등 법적인 이유로 제공하지 않는 내용입니다.',
		action: 'articles',
	},
	500: {
		icon: 'server',
		title: '일시적인 오류가 생겼습니다',
		description: '서버에 문제가 생겼습니다. 잠시 뒤 다시 시도해 주십시오. 계속되면 아래 문의처로 알려 주십시오.',
		action: 'retry',
	},
	501: {
		icon: 'tool',
		title: '아직 준비 중인 기능입니다',
		description: '곧 이용할 수 있게 하겠습니다.',
		action: 'home',
	},
	502: { icon: 'server', title: '서버와 연결하지 못했습니다', description: `${RETRY_LATER}`, action: 'retry' },
	503: {
		icon: 'tool',
		title: '잠시 점검 중입니다',
		description: '더 나은 서비스를 위해 점검하고 있습니다. 잠시 뒤 다시 들러 주십시오.',
		action: 'retry',
	},
	504: { icon: 'clock', title: '서버 응답이 늦습니다', description: `${RETRY_LATER}`, action: 'retry' },
	505: {
		icon: 'refresh',
		title: '브라우저를 업데이트해 주십시오',
		description: '지원하지 않는 방식으로 연결됐습니다. 최신 브라우저로 다시 시도해 주십시오.',
		action: 'retry',
	},
	506: { icon: 'server', title: '서버 설정에 문제가 있습니다', description: `${RETRY_LATER}`, action: 'retry' },
	507: { icon: 'server', title: '서버 저장 공간이 부족합니다', description: `${RETRY_LATER}`, action: 'retry' },
	508: { icon: 'server', title: '서버 처리 중 문제가 생겼습니다', description: `${RETRY_LATER}`, action: 'retry' },
	510: { icon: 'server', title: '요청을 처리할 수 없습니다', description: `${RETRY_LATER}`, action: 'retry' },
	511: {
		icon: 'wifi',
		title: '네트워크 로그인이 필요합니다',
		description: '카페·공항 와이파이라면 먼저 와이파이 로그인 화면에서 로그인해 주십시오.',
		action: 'retry',
	},
};

/** 지운 뉴스레터 주소로 들어왔을 때 */
export const DELETED_NEWSLETTER: ErrorStateCopy = {
	icon: 'deleted',
	title: '삭제되었거나 없는 뉴스레터입니다',
	description: '뉴스레터가 내려갔거나 주소가 잘못되었습니다. 다른 뉴스레터를 둘러보십시오.',
	action: 'articles',
};

/** 표에 없는 코드는 같은 백의 대표 코드로 (예: 499 → 400, 599 → 500) */
export const errorStateFor = (status: number): ErrorStateCopy =>
	ERROR_STATES[status] ?? ERROR_STATES[status >= 500 ? 500 : 400];

/** 오류 객체에서 HTTP 상태 찾기. ApiError는 status를, 그 밖에는 메시지 속 세 자리 숫자를 본다 */
export const statusOf = (error: unknown): number => {
	if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') return error.status;
	const match = error instanceof Error ? error.message.match(/\b([45]\d{2})\b/) : null;
	return match ? Number(match[1]) : 500;
};
