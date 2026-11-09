import type { MonthIndex } from './mails';

/** 마이페이지: 스크랩(형광펜) · 북마크 · 내 취향. 날짜는 ISO 문자열 */

/** 스크랩 한 줄 (GET /mypage/highlights, /mypage/highlights/page의 items) */
export interface Highlight {
  id: number;
  newsletterId: number;
  /** 본문의 어느 구역인지 (briefing · story-1 …) */
  section: string | null;
  /** 소식(story-N)이면 그 소식의 제목 (스크랩할 때 꺼내 둔 것, 빈 글이면 제목 없음) */
  sectionTitle?: string | null;
  /** 소식(story-N)이면 그 소식의 사진 (마이페이지 쪽 목록에만, 없으면 null) */
  sectionImage?: string | null;
  /** 그 소식의 태그 (뉴스레터 태그 중 소식 글에 나오는 것, 마이페이지 쪽 목록에만) */
  sectionTags?: string[];
  text: string;
  note: string | null;
  /** 중요 표시 (별) */
  starred: boolean;
  /** 폴더 (없으면 null) */
  folderId: number | null;
  createdAt: string;
  updatedAt: string;
  /** 썸네일(image)은 마이페이지 쪽 목록에만 온다 */
  newsletter?: {
    title: string;
    createdAt: string;
    image?: string | null;
    category: { id: number; name: string };
  };
}

/** 마이페이지 스크랩 한 쪽 (GET /mypage/highlights/page) */
export interface HighlightPage {
  items: Highlight[];
  total: number;
  /** 폴더 줄(전체 · 폴더 없음) · 보기 칩(고른 폴더 안의 중요 · 메모) 개수 */
  counts: { all: number; unfiled: number; starred: number; memo: number };
  /** 달 막대 바로 가기: 거르기 · 정렬을 적용한 순서로 달마다 개수와 그 달 첫 스크랩의 순번 */
  months?: MonthIndex[];
}

/** 북마크한 뉴스레터 한 줄 */
export interface BookmarkItem {
  id: number;
  newsTitle: string;
  newsImg: string;
  newsCreatedAt: string;
  newsSummary: string;
  category: { id: number; name: string };
  /** 북마크한 시각 · 폴더 · 조회수 (#123 폴더 · 정렬) */
  bookmarkedAt: string;
  folderId: number | null;
  viewcount: number;
}

/** 마이페이지 북마크 한 쪽 (GET /mypage/bookmarks/page) */
export interface BookmarkPage {
  items: BookmarkItem[];
  total: number;
  /** 폴더 줄 개수 (거르기와 상관없이) */
  counts: { all: number; unfiled: number };
  /** 내 북마크에 있는 관심사 (거르기 칩) */
  categories: { id: number; name: string }[];
}

/** 내 취향 (GET /mypage/taste): 북마크 · 스크랩 · 메모로 매긴 주제 · 관심사 점수 */
export interface MyTaste {
  weights: { bookmark: number; scrap: number; memo: number };
  halfLifeDays: number;
  signals: { bookmark: number; scrap: number; memo: number };
  topics: {
    topic: string;
    score: number;
    bookmark: number;
    scrap: number;
    memo: number;
  }[];
  categories: { categoryId: number; name: string | null; score: number }[];
}
