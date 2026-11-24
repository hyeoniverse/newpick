/** '11월 24일 오후 3:12' (KST): 지난 속보 화면 */
export const kstDateTime = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(iso));
