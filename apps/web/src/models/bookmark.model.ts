interface BookmarkCtegory {
	id: number;
	name: string;
}

export interface IBookmarkItem {
	id: number;
	newsTitle: string;
	newsImg: string;
	newsCreatedAt: string;
	newsSummary: string;
	category: BookmarkCtegory;
	/** 북마크한 시각 · 폴더 · 조회수 (#123 폴더 · 정렬) */
	bookmarkedAt: string;
	folderId: number | null;
	viewcount: number;
}
