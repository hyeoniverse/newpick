/** 로그인한 사람의 정보 · 마이페이지 응답. 날짜는 ISO 문자열 */

export type UserRole = 'user' | 'admin';

/** GET /mypage/profile */
export interface Profile {
  id: number;
  email: string;
  /** 구글 계정 이름. 없을 수 있다 */
  username: string | null;
  profileImg: string | null;
  timezone: string;
  /** 관리자 화면 접근 여부 (실제 권한 확인은 api) */
  role: UserRole;
  /** 관심 분야 id */
  interests: number[];
}

/** 스크랩 · 북마크 · 메일을 담는 폴더 (GET /mypage/folders) */
export interface Folder {
  id: number;
  name: string;
  counts: { highlights: number; bookmarks: number; mails: number };
}

/** 팔로우한 태그 (GET /mypage/tag-follows) */
export interface TagFollow {
  tag: string;
  createdAt: string;
  /** 이 태그가 붙은 최근 뉴스레터 (오래된 것 → 새것) */
  news: { id: number; title: string; createdAt: string; category: string }[];
}
