import type { ArticlePick } from 'src/recommend/pick';

/** 메일 계획 타입 (#199에서 personalize · personal-note에서 떼어 냄): 맞춤 순서 · 맞춤 글 · 추천 기사 · 태그 · 후속 칸 */

/** 한 사람의 메일 계획. 발송 기록에 함께 남겨 마이페이지에서 받은 그대로 다시 만든다 */
export type MailPlan = {
  /** 메일에 싣는 소식, 점수 높은 순 */
  picks: { ref: string; newsletterId: number }[];
  /** 사람마다 쓴 제목 · 맞춤 브리핑 (personal-note.ts). 못 쓰면 없음 */
  note?: PersonalNote | null;
  /** 뉴스레터에 쓰지 않은 오늘 기사 중 관심과 가까운 원문 (recommend) */
  articles?: ArticlePick[];
  /** 팔로우한 태그 칸 (#123 5단계): 태그마다 그날 소식 · 뉴스레터에 안 실린 기사 */
  tags?: TagNews[];
  /** 지켜보던 소식의 후속 (지난 메일 이후 새로 이어진 것, FollowsService.forMail) */
  follows?: MailFollow[];
};

/** 메일에 싣는 후속 하나 */
export type MailFollow = {
  /** 지켜보던 소식 제목 */
  followed: string;
  /** 지켜보던 소식이 실린 뉴스레터 (원문 링크) */
  followedNewsletterId: number;
  /** 이어진 새 소식 제목 */
  heading: string;
  /** 어떻게 이어지는지 한 줄 (없으면 빈 문자열) */
  reason: string;
  newsletterId: number;
  category: string;
};

/** 팔로우한 태그 하나의 그날 소식 */
export type TagNews = {
  tag: string;
  stories: {
    ref: string;
    newsletterId: number;
    category: string;
    heading: string;
  }[];
  articles: ArticlePick[];
};

/** 사람마다 쓴 메일 제목 · 맞춤 브리핑 (personal-note.ts가 쓴다) */
export type PersonalNote = {
  subject: string;
  briefing: string;
};
