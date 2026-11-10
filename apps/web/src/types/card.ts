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
	/** 휴대폰 목록 카드: 분야 옆 날짜, 아래 줄 오른쪽 단추(북마크) */
	date?: string;
	action?: React.ReactNode;
	url?: string;
	target?: string;
}
