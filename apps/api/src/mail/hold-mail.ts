import { accountMailHtml } from './account-mail';

const names = (categories: string[]) => categories.map((name) => `<b>${name}</b>`).join(', ');

/**
 * 고른 분야 가운데 아직 만들지 못한 분야가 있어 뉴스레터를 미뤘을 때의 안내 (#341). 재시도로 만들어지면 그날 안에 보낸다
 */
export const holdNoticeMail = (categories: string[]) => ({
	subject: '[뉴픽] 오늘 뉴스레터가 조금 늦어집니다',
	html: accountMailHtml(
		'오늘 뉴스레터가 조금 늦어집니다',
		`<p style="margin:0;font-size:15px;line-height:1.6">고르신 분야 가운데 ${names(categories)} 뉴스레터를 아직 만들지 못했습니다. 준비되는 대로 오늘 안에 보내 드리겠습니다.</p>`,
	),
});

/** 미뤘던 분야를 그날 끝내 만들지 못해, 고른 분야 가운데 보낼 것이 하나도 없을 때의 안내 (#341) */
export const gaveUpNoticeMail = (categories: string[]) => ({
	subject: '[뉴픽] 오늘 뉴스레터를 보내 드리지 못했습니다',
	html: accountMailHtml(
		'오늘 뉴스레터를 보내 드리지 못했습니다',
		`<p style="margin:0;font-size:15px;line-height:1.6">오늘은 ${names(categories)} 뉴스레터를 만들지 못해 보내 드리지 못했습니다. 내일 뉴스레터는 평소처럼 보내 드리겠습니다.</p>`,
	),
});
