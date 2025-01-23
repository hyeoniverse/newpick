'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { POPUP } from '@/constants/numbers';
import { AUTH_ERRORS } from '@/constants/errors';
import { User } from '@/models/user.model';
import { useAuthStore } from '@/stores/authStore';
import { useError } from '@/hooks/useError';
import { useInterval } from '@/hooks/useInterval';

export const useAuth = () => {
	const { user, token, isLoading, setUser, setToken, setLoading, logout } = useAuthStore();
	const { showError } = useError();
	const [popup, setPopup] = useState<Window | null>(null);
	const [popupCheckKey, setPopupCheckKey] = useState(0);
	const hasFetchedUser = useRef(false);
	const setLoadingRef = useRef(setLoading);
	const [forceUpdate, setForceUpdate] = useState(0);

	/** 로그아웃 */
	const handleLogout = useCallback(() => {
		localStorage.removeItem('authToken');
		logout();
		setForceUpdate((prev) => prev + 1); // 상태 강제 업데이트
	}, [logout]);

	/** 사용자 정보 가져오기 */
	const fetchUser = useCallback(
		async (authToken: string) => {
			if (hasFetchedUser.current) return;
			hasFetchedUser.current = true;
			setLoadingRef.current(true);

			try {
				const response = await fetch(API_ENDPOINTS.AUTH.USER, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${authToken}`,
					},
					credentials: 'include',
				});

				if (!response.ok) throw new Error(await response.text());

				const userData: User = await response.json();
				if (!userData) throw new Error(AUTH_ERRORS.FETCH_FAILED);

				flushSync(() => {
					setUser(userData);
					setToken(authToken);
				});
				setForceUpdate((prev) => prev + 1);
			} catch (error) {
				showError((error as Error).message || AUTH_ERRORS.FETCH_FAILED);
				handleLogout();
			} finally {
				setTimeout(() => setLoadingRef.current(false), 0);
			}
		},
		[setUser, setToken, showError, handleLogout]
	);

	/** 앱 로드 시 저장된 토큰 확인 */
	useEffect(() => {
		const storedToken = localStorage.getItem('authToken');
		if (!storedToken) {
			setTimeout(() => setLoadingRef.current(false), 0);
			return;
		}
		if (!user && !hasFetchedUser.current) {
			fetchUser(storedToken);
		}
	}, [user, fetchUser]);

	/** OAuth 로그인 */
	const login = useCallback(() => {
		const newPopup = window.open(API_ENDPOINTS.AUTH.LOGIN, '_blank', `width=${POPUP.WIDTH},height=${POPUP.HEIGHT}`);

		if (!newPopup) {
			showError(AUTH_ERRORS.POPUP_BLOCKED);
			return;
		}

		setPopup(newPopup);
		setPopupCheckKey((prev) => prev + 1);
	}, [showError]);

	/** OAuth 응답 메시지 핸들러 */
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== BASE_URL) return;

			if (event.data.type === 'oauthSuccess' && event.data.token) {
				localStorage.setItem('authToken', event.data.token);
				fetchUser(event.data.token);
			} else {
				showError(AUTH_ERRORS.OAUTH_FAILED);
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [fetchUser, showError]);

	/** OAuth 팝업 닫힘 감지 */
	useInterval(
		() => {
			if (popup?.closed) {
				setPopup(null);
				showError(AUTH_ERRORS.POPUP_CLOSED);
			}
		},
		popup ? POPUP.CHECK_INTERVAL : null,
		popupCheckKey
	);

	/** Zustand 상태 변경 감지 (즉시 반영) */
	useEffect(() => {
		const unsubscribe = useAuthStore.subscribe((state) => {
			if (state.user) setForceUpdate((prev) => prev + 1);
		});
		return () => unsubscribe();
	}, []);

	return { user, token, isLoading, login, logout: handleLogout, forceUpdate };
};
