import { cx } from '@/styles/tw';

/** 표 안의 줄 동작(권한 · 지우기)과 '나' 표시 — 수집 기사 · 태그 화면과 같은 모양 */
export const AdminActions = ({ className, ...props }: React.ComponentProps<'div'>) => (
	<div className={cx('np-admin-users-admin-actions', className)} {...props} />
);
