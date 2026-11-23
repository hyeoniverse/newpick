/** 홈 '오늘' 묶음 (GET /edition/today). 이미 만든 편집본 · 조회 기록 · 스크랩 · 태그로 모은다 (AI 호출 없음) */

/** 소식 한 건 (뉴스레터 안의 n번째 소식) */
export interface HomeStory {
  newsletterId: number;
  /** 뉴스레터 안 순서 (1부터) */
  storyIndex: number;
  category: string;
  heading: string;
  /** 한 줄: 편집자가 쓴 한눈에 보기용 문장, 없으면 리드 */
  line: string;
  /** 중요도 1~5 (편집본 → 뉴스레터를 쓸 때 매긴 것, 둘 다 없으면 0) */
  importance: number;
  image: string | null;
}

/** 분야를 넘는 흐름: 서로 다른 분야 소식을 잇는 해설 */
export interface HomeThread {
  title: string;
  text: string;
  stories: Pick<HomeStory, 'newsletterId' | 'storyIndex' | 'category' | 'heading'>[];
}

/** 지금 뜨는 태그: 오늘 나온 횟수와 지난 7일 하루 평균 */
export interface HomeRisingTag {
  tag: string;
  today: number;
  /** 지난 7일 하루 평균 (0이면 새로 나온 태그) */
  average: number;
}

/** 많이 읽은 뉴스레터 (최근 7일 상세 화면 조회) */
export interface HomeMostRead {
  newsletterId: number;
  title: string;
  category: string;
  views: number;
}

/** 많이 스크랩한 소식 (최근 30일) */
export interface HomeMostScrapped {
  newsletterId: number;
  /** 스크랩한 소식 제목 (구역 제목이 없으면 뉴스레터 제목) */
  heading: string;
  category: string;
  scraps: number;
}

export interface HomeToday {
  /** 편집본 날짜 (KST, 가장 최근 발행일) */
  date: string;
  /** 오늘의 3줄: 중요도 순 상위 3개 */
  topLines: HomeStory[];
  /** 오늘의 트렌드: 중요도와 오늘 조회를 함께 본 소식 (3줄과 겹치지 않게) */
  trending: HomeStory[];
  threads: HomeThread[];
  risingTags: HomeRisingTag[];
  mostRead: HomeMostRead[];
  mostScrapped: HomeMostScrapped[];
}
