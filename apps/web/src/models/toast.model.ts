export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-bottom';
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
	id: number;
	message: string;
	type: ToastType;
	duration?: number;
}
