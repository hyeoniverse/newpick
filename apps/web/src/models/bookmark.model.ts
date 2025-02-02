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
}