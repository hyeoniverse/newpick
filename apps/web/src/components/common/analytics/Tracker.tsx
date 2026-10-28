'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 방문 통계 수집기 (#131). 쿠키를 쓰지 않고, 탭마다 임시 번호(sessionStorage, 탭을 닫으면 사라짐)만 둔다.
 * IP · 계정은 보내지 않는다. 페이지마다 머문 시간 · 스크롤 깊이 · 문서 20칸 · 구역마다 화면에 보인 시간 · 클릭 위치를 모아
 * 15초마다 · 탭을 숨길 때 · 페이지를 옮길 때 누적 값을 보낸다 (같은 보기 번호로 덮어씀).
 * 관리자 화면 · 자동화 브라우저 · 추적 거부(Do Not Track · GPC) · 히트맵 미리보기(?__notrack)는 모으지 않는다
 */
const ENDPOINT = '/api/analytics/collect';
const SESSION_KEY = 'np-visit';
/** 문서를 몇 칸으로 나눠 머문 시간을 세는지 (API와 같음) */
const BANDS = 20;
const MAX_CLICKS = 100;
/** 이만큼 움직임이 없으면 자리를 비운 것으로 보고 시간을 세지 않는다 */
const IDLE_MS = 30_000;
const FLUSH_MS = 15_000;

const randomId = () => {
	const bytes = new Uint8Array(12);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
		.join('')
		.slice(0, 20);
};

function trackingAllowed(pathname: string) {
	if (/^\/admin(\/|$)/.test(pathname)) return false;
	if (new URLSearchParams(location.search).has('__notrack')) return false;
	const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
	if (nav.doNotTrack === '1' || nav.globalPrivacyControl) return false;
	// 자동화 브라우저(테스트 · 봇). 직접 확인할 때는 localStorage 'np-track-debug'로 켠다
	let debug = false;
	try {
		debug = localStorage.getItem('np-track-debug') === '1';
	} catch {}
	return debug || !nav.webdriver;
}

/** 탭 번호 (없으면 새로 만들고 이 탭의 첫 페이지로 본다) */
function visitSession(): { id: string; isNew: boolean } {
	try {
		const saved = sessionStorage.getItem(SESSION_KEY);
		if (saved) return { id: saved, isNew: false };
		const id = randomId();
		sessionStorage.setItem(SESSION_KEY, id);
		return { id, isNew: true };
	} catch {
		return { id: randomId(), isNew: true };
	}
}

/**
 * 머문 시간을 셀 구역: data-track-section 이름표, 뉴스레터 본문(data-track-content)의 브리핑 · 소식은 자동으로
 * (본문은 저장된 HTML이라 이름표를 달 수 없어서)
 */
function sectionsOnPage(): [string, Element][] {
	const list: [string, Element][] = Array.from(document.querySelectorAll('[data-track-section]')).map((el) => [
		el.getAttribute('data-track-section') ?? 'section',
		el,
	]);
	document.querySelectorAll('[data-track-content]').forEach((root) => {
		root.querySelectorAll('.briefing').forEach((el) => list.push(['briefing', el]));
		root.querySelectorAll('.story').forEach((el, i) => list.push([`story-${i + 1}`, el]));
	});
	return list;
}

function startView(pathname: string, session: { id: string; isNew: boolean }, first: boolean) {
	const id = randomId();
	let referrerHost: string | undefined;
	let fromOwnSite = false;
	if (first && document.referrer) {
		try {
			const host = new URL(document.referrer).host;
			if (host === location.host) fromOwnSite = true;
			else referrerHost = host;
		} catch {}
	}
	// 이 탭의 첫 페이지 (사이트 안 링크를 새 탭으로 연 것은 첫 페이지가 아님)
	const entry = first && session.isNew && !fromOwnSite;
	const params = new URLSearchParams(location.search);
	const utm = (key: string) => params.get(`utm_${key}`)?.slice(0, 100) || undefined;

	let durationMs = 0;
	let scrollDepth = 0;
	const attention = Array.from({ length: BANDS }, () => 0);
	const sections: Record<string, number> = {};
	const clicks: [number, number, string?][] = [];
	let lastActive = Date.now();
	let lastTick = Date.now();
	let dirty = true;
	/** 첫 기록을 보냈는지. 1초도 안 머문 보기(바로 넘긴 페이지 · 개발 모드의 두 번 실행)는 남기지 않는다 */
	let started = false;

	const docHeight = () => Math.max(document.documentElement.scrollHeight, innerHeight, 1);

	const tick = () => {
		const now = Date.now();
		const dt = Math.min(now - lastTick, 2000);
		lastTick = now;
		const height = docHeight();
		const top = scrollY;
		const bottom = scrollY + innerHeight;
		scrollDepth = Math.max(scrollDepth, Math.min(100, Math.round((bottom / height) * 100)));
		if (document.visibilityState !== 'visible' || now - lastActive > IDLE_MS || dt <= 0) return;
		durationMs += dt;
		// 문서 20칸: 화면에 보인 만큼 나눠 더한다
		const band = height / BANDS;
		for (let i = 0; i < BANDS; i++) {
			const overlap = Math.min(bottom, (i + 1) * band) - Math.max(top, i * band);
			if (overlap > 0) attention[i] += Math.round((dt * overlap) / band);
		}
		// 구역: 절반 넘게 보이거나 화면 절반 넘게 차지하면 보는 중
		for (const [name, el] of sectionsOnPage()) {
			const rect = el.getBoundingClientRect();
			if (rect.height <= 0) continue;
			const visible = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
			if (visible > 0 && visible >= Math.min(rect.height, innerHeight) * 0.5) {
				sections[name] = (sections[name] ?? 0) + dt;
			}
		}
		dirty = true;
	};

	const send = () => {
		if (!dirty || !started) return;
		dirty = false;
		const body = JSON.stringify({
			id,
			sessionId: session.id,
			path: pathname.slice(0, 255),
			entry,
			referrerHost,
			utmSource: utm('source'),
			utmMedium: utm('medium'),
			utmCampaign: utm('campaign'),
			viewportW: Math.round(innerWidth),
			durationMs,
			scrollDepth,
			sections,
			attention,
			clicks,
		});
		const blob = new Blob([body], { type: 'application/json' });
		if (!navigator.sendBeacon?.(ENDPOINT, blob)) {
			fetch(ENDPOINT, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(
				() => {},
			);
		}
	};

	const active = () => {
		lastActive = Date.now();
	};
	const onClick = (event: MouseEvent) => {
		active();
		if (clicks.length >= MAX_CLICKS) return;
		const target = event.target as Element | null;
		// 누른 곳을 품은 구역 중 가장 작은 것
		let section: string | undefined;
		let smallest = Infinity;
		for (const [name, el] of sectionsOnPage()) {
			if (!target || !el.contains(target)) continue;
			const area = el.getBoundingClientRect().height;
			if (area < smallest) {
				smallest = area;
				section = name;
			}
		}
		const x = Math.round((event.clientX / innerWidth) * 10000) / 10000;
		const y = Math.round((event.pageY / docHeight()) * 10000) / 10000;
		clicks.push(section ? [x, y, section] : [x, y]);
		dirty = true;
	};
	const onHide = () => {
		if (document.visibilityState === 'hidden') {
			tick();
			send();
		} else {
			lastTick = Date.now();
			active();
		}
	};
	const onPageHide = () => {
		tick();
		send();
	};

	const ticker = window.setInterval(tick, 1000);
	const flusher = window.setInterval(() => {
		tick();
		send();
	}, FLUSH_MS);
	const activity = ['scroll', 'mousemove', 'keydown', 'touchstart', 'wheel'] as const;
	activity.forEach((type) => addEventListener(type, active, { passive: true }));
	addEventListener('click', onClick, { capture: true, passive: true });
	document.addEventListener('visibilitychange', onHide);
	addEventListener('pagehide', onPageHide);
	// 1초 머물면 첫 기록: 금방 나가도 들어온 기록은 남게
	const opener = window.setTimeout(() => {
		started = true;
		tick();
		send();
	}, 1000);

	return () => {
		window.clearTimeout(opener);
		tick();
		send();
		window.clearInterval(ticker);
		window.clearInterval(flusher);
		activity.forEach((type) => removeEventListener(type, active));
		removeEventListener('click', onClick, { capture: true });
		document.removeEventListener('visibilitychange', onHide);
		removeEventListener('pagehide', onPageHide);
	};
}

/** 이 문서를 처음 연 경로 (개발 모드에서 효과가 두 번 돌아도 첫 페이지로 남게) */
let entryPath: string | null = null;
/** 첫 페이지를 떠난 적이 있으면, 다시 돌아와도 첫 페이지가 아니다 */
let leftEntry = false;
let session: { id: string; isNew: boolean } | null = null;

export default function Tracker() {
	const pathname = usePathname();
	useEffect(() => {
		if (!pathname) return;
		entryPath ??= pathname;
		if (pathname !== entryPath) leftEntry = true;
		if (!trackingAllowed(pathname)) return;
		session ??= visitSession();
		return startView(pathname, session, !leftEntry);
	}, [pathname]);
	return null;
}
