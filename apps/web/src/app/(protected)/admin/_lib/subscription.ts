/** 구독 상태 이름 · 배지 색 (구독자 화면과 같이 씀) */
export const SUBSCRIPTION_LABEL: Record<string, string> = { active: '구독 중', paused: '일시 정지', cancelled: '해지' };
export const subscriptionTone = (status: string | null) =>
	status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'neutral';
