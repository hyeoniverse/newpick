export interface Card {
	id: number | string;
	image?: string;
	header: string | React.ReactNode;
	main: {
		title?: string;
		description: string;
	};
	footer?: string | React.ReactNode;
	url?: string;
	target?: string;
}
