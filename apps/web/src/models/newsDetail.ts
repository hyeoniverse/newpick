export interface INewsDetail {
  id: number;
  title: string;
  summary: string;
  content: string;
  img: string;
  categoryId: number;
  userId: number;
  createdAt: string;
  likes: number;
  viewcount: number;
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
