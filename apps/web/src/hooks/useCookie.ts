import { TOKEN } from '@/constants/api';

export const useCookie = () => {
	// 쿠키 값을 가져오는 함수
	const getCookieValue = (name: string): string | null => {
		if (typeof document === 'undefined') return null;
		return (
			document.cookie
				.split('; ')
				.find((row) => row.startsWith(`${name}=`))
				?.split('=')[1] || null
		);
	};

	// 쿠키 설정 함수
	const setCookie = (name: string, value: string, maxAge: number) => {
		document.cookie = `${name}=${value}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
	};

	// 쿠키 삭제 함수
	const deleteCookie = (name: string) => {
		document.cookie = `${name}=; Path=/; Max-Age=0`;
	};

	const getAuthCookies = () => {
		const token = getCookieValue(TOKEN.ACCESS);
		const rawUserId = getCookieValue(TOKEN.USER_ID);
		const userId = rawUserId ? parseInt(rawUserId, 10) : null;
		return { token, userId };
	};

	return { getCookieValue, setCookie, deleteCookie, getAuthCookies };
};
