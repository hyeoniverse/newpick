import type { BreakingArticle } from '@newpick/shared';
import { MAIL_COLORS as C, MAIL_FONT as FONT, escapeMail as esc } from 'src/edition/mail';

/** 속보 메일에 쓰는 것 (breaking_alerts 한 행) */
export type BreakingMailInput = {
	id: number;
	headline: string;
	reason: string;
	articles: BreakingArticle[];
	detectedAt: Date;
};

/** 받는 사람마다 다른 링크: 없으면(미리보기) 마이페이지 설정 */
export type BreakingMailLinks = {
	/** 속보 메일만 끄기 (로그인 없이, 매일 메일은 그대로) */
	offUrl?: string;
	/** 구독 해지 (정보통신망법 제50조: 수신 거부 방법 안내) */
	unsubscribeUrl?: string;
};

const isWebUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

/** 메일 제목: 받은편지함에서 속보인 것이 바로 보이게 */
export const breakingSubject = (headline: string) => `[속보] ${headline}`;

/** '오후 3시 12분' (KST) */
const kstTime = (date: Date) =>
	new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: 'numeric', minute: 'numeric' }).format(date);

/**
 * 속보 메일 HTML (속보 뉴스레터 2단계). 매일 메일(edition/mail.ts)과 같은 색 · 글꼴, 인라인 스타일만.
 * 한 사건만 짧게: 속보 표시 · 시각 → 사건 한 줄 → 왜 속보인지 → 관련 기사(원문) → 사이트에서 보기.
 * 아래에 '속보만 끄기'(매일 메일은 그대로)와 수신 거부
 */
export function renderBreakingMail(
	alert: BreakingMailInput,
	frontendUrl: string,
	contactEmail = '',
	links: BreakingMailLinks = {},
): { subject: string; html: string } {
	const base = frontendUrl.replace(/\/$/, '');
	const utm = 'utm_source=newsletter&utm_medium=email&utm_campaign=breaking';
	const subject = breakingSubject(alert.headline);
	const settings = `${base}/mypage?tab=settings`;

	const articles = alert.articles
		.filter((x) => isWebUrl(x.link))
		.map(
			(x, i) =>
				`<div style="${i ? `margin-top:12px;padding-top:12px;border-top:1px solid ${C.border};` : ''}"><p style="margin:0 0 4px;font-size:12px;color:${C.muted};">${esc(x.source)}</p><a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer" style="font-size:15px;font-weight:700;line-height:1.5;color:${C.text};text-decoration:underline;">${esc(x.title)}</a></div>`,
		)
		.join('');

	const body = [
		`<p style="margin:0 0 14px;font-size:13px;font-weight:800;color:#d92d20;">● 속보 <span style="font-weight:600;color:${C.muted};">${esc(kstTime(alert.detectedAt))}</span></p>`,
		`<h1 style="margin:0 0 14px;font-size:24px;line-height:1.4;font-weight:800;color:${C.text};">${esc(alert.headline)}</h1>`,
		`<p style="margin:0 0 22px;font-size:15px;line-height:1.75;color:${C.sub};">${esc(alert.reason)}</p>`,
		articles &&
			`<h3 style="margin:0 0 12px;font-size:13px;font-weight:800;letter-spacing:0.04em;color:${C.muted};">관련 기사</h3>${articles}`,
		`<p style="margin:24px 0 0;"><a href="${esc(`${base}/breaking/${alert.id}?${utm}`)}" target="_blank" rel="noopener noreferrer" style="font-size:14px;font-weight:700;color:${C.primary};text-decoration:none;">뉴픽에서 보기 →</a></p>`,
	].join('');

	const footerLink = (text: string, href: string) =>
		`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" style="color:${C.muted};text-decoration:underline;">${esc(text)}</a>`;
	const footer = `<tr><td style="padding:8px 24px 0;font-size:12px;line-height:1.8;color:${C.muted};text-align:center;">큰 사건이 생기면 바로 알려 드리는 뉴픽 속보입니다. 하루 최대 3건까지 보내 드립니다.<br>AI가 여러 언론사 기사를 모아 판단했습니다. 자세한 내용은 출처 기사를 함께 확인하세요.<br>${[
		footerLink('속보만 받지 않기', links.offUrl ?? settings),
		footerLink('받는 시간 설정', settings),
		footerLink('수신 거부', links.unsubscribeUrl ?? settings),
		footerLink('뉴픽 홈', `${base}/?${utm}`),
	].join(' · ')}${contactEmail ? `<br>문의 ${footerLink(contactEmail, `mailto:${contactEmail}`)}` : ''}</td></tr>`;

	const preheader = `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(alert.reason)}</div>`;

	const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(subject)}</title></head><body style="margin:0;padding:0;background:${C.page};">${preheader}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};font-family:${FONT};"><tr><td align="center" style="padding:20px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-collapse:separate;"><tr><td style="padding:28px 24px;background:#ffffff;border-radius:12px;border-top:4px solid #d92d20;">${body}</td></tr><tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>${footer}</table></td></tr></table></body></html>`;
	return { subject, html };
}
