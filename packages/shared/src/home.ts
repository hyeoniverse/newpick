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

/**
 * 지금 뜨는 태그: 최근 3일 동안 나온 횟수와, 그 전 4주 하루 평균으로 본 '평소 3일' 횟수.
 * 하루만 보면 하루 6편이라 횟수가 1~2뿐이어서 처음 나온 태그가 거의 전부 '새로'가 되고 매일 뒤바뀌었다
 */
export interface HomeRisingTag {
  tag: string;
  /** 최근 3일 동안 나온 뉴스레터 수 (뉴스레터 키워드 · 소식 태그, 한 편에 한 번) */
  recent: number;
  /** 그 전 4주 하루 평균 × 3 (0이면 그 4주 동안 없던 태그) */
  usual: number;
}

/**
 * 최신 트렌드 = 주제별: 지금 뜨는 태그 하나와 그 주제를 다룬 최근 소식들 (분야 · 날짜를 가리지 않는다).
 * 핵심 3줄(중요도) · 최신 뉴스레터(분야) · 지금 뜨는 소식(조회 · 스크랩)과 묶는 기준이 다르다
 */
export interface HomeTopic extends HomeRisingTag {
  /** 그 태그가 붙은 최근 3일 소식 (새것부터) */
  stories: HomeStory[];
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
  /** 최신 트렌드: 뜨는 주제마다 그 주제의 최근 소식 */
  topics: HomeTopic[];
  threads: HomeThread[];
  risingTags: HomeRisingTag[];
  mostRead: HomeMostRead[];
  mostScrapped: HomeMostScrapped[];
}
