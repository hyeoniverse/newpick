/** 로그인한 기기 목록에 보일 이름: User-Agent에서 브라우저 · OS만 (버전은 뺀다) */
export interface DeviceInfo {
	browser: string;
	os: string;
	mobile: boolean;
}

const BROWSERS: [RegExp, string][] = [
	[/Edg(A|iOS)?\//, 'Edge'],
	[/Whale\//, 'Whale'],
	[/SamsungBrowser\//, '삼성 인터넷'],
	[/NAVER\(|NaverApp/, '네이버 앱'],
	[/KAKAOTALK/i, '카카오톡'],
	[/OPR\/|Opera/, 'Opera'],
	[/Firefox\/|FxiOS\//, 'Firefox'],
	[/Chrome\/|CriOS\//, 'Chrome'],
	[/Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
	[/iPad/, 'iPad'],
	[/iPhone|iPod/, 'iPhone'],
	[/Android/, 'Android'],
	[/Windows/, 'Windows'],
	[/Mac OS X|Macintosh/, 'macOS'],
	[/CrOS/, 'ChromeOS'],
	[/Linux/, 'Linux'],
];

export function describeUserAgent(userAgent: string | null | undefined): DeviceInfo {
	const ua = userAgent ?? '';
	const browser = BROWSERS.find(([pattern]) => pattern.test(ua))?.[1] ?? '알 수 없는 브라우저';
	const os = SYSTEMS.find(([pattern]) => pattern.test(ua))?.[1] ?? '알 수 없는 기기';
	return { browser, os, mobile: /Mobi|iPhone|iPad|Android/.test(ua) };
}
