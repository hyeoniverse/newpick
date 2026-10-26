export interface Card {
	id: number | string;
	image?: string;
	header: string | React.ReactNode;
	main: {
		title?: string;
		description: string;
		/** 키워드 (#50). 목록 카드에만 표시 */
		tags?: string[];
		/** 톱 카드 안의 소식 목록 (분야 페이지 배너) */
		points?: { kicker: string; heading: string }[];
	};
	footer?: string | React.ReactNode;
	url?: string;
	target?: string;
}
