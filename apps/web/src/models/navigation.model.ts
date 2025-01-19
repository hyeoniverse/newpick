export interface NavigationItem {
	id: number;
	title: string;
	link: string;
}

export interface Navigation extends NavigationItem {
	subItems?: NavigationItem[];
}
