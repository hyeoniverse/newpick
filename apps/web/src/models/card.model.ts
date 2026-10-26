export interface Card {
	id: number | string;
	image?: string;
	header: string | React.ReactNode;
	main: {
		title?: string;
		description: string;
		/** 키워드 (#50). 목록 카드에만 표시 */
		tags?: string[];
	};
	footer?: string | React.ReactNode;
	url?: string;
	target?: string;
}
