/**
 * 뉴픽이 소식을 만드는 과정 (홈 '지금 뉴픽은', GET /pipeline/live).
 * 매시 수집(모으기 → 분야 나누기 → 같은 사건 묶기 → 속보 판정)과 매일 아침 뉴스레터 만들기를 돌 때는 실시간으로, 아닐 때는 마지막 결과를 보여 준다.
 * 언론사 기사 제목은 담지 않는다: 건수 · 키워드 · 묶음(묶음 이름은 키워드)만
 */

/** crawl 매시 수집 · summary 매일 아침 뉴스레터 만들기 */
export type PipelineKind = 'crawl' | 'summary';

export type PipelineState = 'waiting' | 'running' | 'done' | 'failed' | 'skipped';

export interface PipelineStep {
  key: string;
  label: string;
  state: PipelineState;
  /** 이 단계에서 센 수 (새 기사 · 묶음 · 속보 등) */
  count?: number;
  /** 진행: [끝낸 수, 전체] (분야 6개 중 몇 개 등) */
  progress?: [number, number];
}

export interface PipelineCategory {
  name: string;
  /** 기사 수 */
  count: number;
  /** 뉴스레터 만들기에서 이 분야의 상태 (수집에서는 없음) */
  state?: PipelineState;
}

export interface PipelineRun {
  kind: PipelineKind;
  status: 'running' | 'done' | 'failed';
  /** ISO 시각 */
  startedAt: string;
  finishedAt: string | null;
  steps: PipelineStep[];
  categories: PipelineCategory[];
  /** 기사 제목에서 많이 나온 낱말 (많은 것부터) */
  keywords: { word: string; count: number }[];
  /** 같은 사건 묶음 (2건 이상, 큰 것부터). 이름은 묶음 안 제목에 함께 나온 낱말 */
  clusters: { label: string; size: number }[];
}

export interface PipelineLive {
  /** 마지막(또는 지금 도는) 수집 · 뉴스레터 만들기. 아직 한 번도 돌지 않았으면 null */
  crawl: PipelineRun | null;
  summary: PipelineRun | null;
  /** 다음 예약 시각 (ISO). 예약 작업이 꺼져 있으면 null */
  next: { crawl: string | null; summary: string | null };
}
