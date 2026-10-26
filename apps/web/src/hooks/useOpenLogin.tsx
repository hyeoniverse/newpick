import { useCallback } from 'react';
import { useModal } from '@/hooks/useModal';
import LoginSheet from '@/components/common/auth/LoginSheet';

/** 로그인 창 열기 (#66). 헤더 로그인과 "로그인이 필요합니다" 안내가 함께 쓴다 */
export function useOpenLogin() {
	const { openModal } = useModal();
	return useCallback((reason?: string) => openModal(<LoginSheet reason={reason} />), [openModal]);
}
