export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-bottom' | 'center-top';
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
	/** 알림 안에 바로 가는 링크 (예: 스크랩 → 마이페이지의 그 문장) */
	action?: ToastAction;
}

export interface ToastAction {
	label: string;
	href: string;
}
