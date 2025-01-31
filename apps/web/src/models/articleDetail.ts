export interface IArticleDetail {
  id: number;
  title: string;
  content: string;
  contentAsHTML: string;
  imageUrl: string | null;
  categoryId: number;
  viewcount: number;
  usedNews: string;
  createdAt: string;
}

export interface IMySummary {
  id: number;
  categoryName: string;
  userId: number;
  createdAt: string;
  img: string;
  like: number;
  title: string;
  summary: string;
}
