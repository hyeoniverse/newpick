export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-bottom' | 'center-top';
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}
