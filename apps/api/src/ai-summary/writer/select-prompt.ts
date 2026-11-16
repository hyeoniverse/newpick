import { kstDayLabel } from '../../common/kst';
import {
  Cluster,
  isMorning,
  LEAD_CHARS,
  publishedLabel,
} from '../article-prep';
import { LIMITS } from './types';

/** 1단계 고르기 프롬프트 (가벼운 모델, 묶음의 제목과 첫 부분만) */

/**
 * 고르기 응답 한도. 묶음마다 번호 · 제목 · 점수 · 이유 한 줄씩이라 묶음이 많은 날은 5~6천 토큰을 넘는다
 * (11/2~11/7 최대 5,570, 제목 칸이 붙은 11/8부터 6000에서 잘려 이틀 동안 전 분야 실패). 쓴 만큼만 비용이 나와 넉넉히 둔다
 */
export const SELECT_MAX_TOKENS = 16000;

const SCORING_RULES = [
  '## 점수 (각 1~5점)',
  '- 파급: 영향을 받는 사람·돈·시장의 크기. 5 = 나라 전체나 세계 시장·산업 판도(대형 IPO·M&A, 금리·환율 결정, 주요국 정책), 3 = 한 업종이나 지역, 1 = 한 기업·개인.',
  '- 새로움: 오늘 처음 일어난 일인가. 5 = 결정·발표·사상 처음·최대·최저, 3 = 진행 중인 일의 새 국면, 1 = 예고·전망·반복 보도.',
  '- 관심사: 이 분야 독자가 꼭 알아야 하는가. 5 = 분야의 핵심 주제(해외 기업·시장이라도 분야 핵심이면 5), 1 = 분야와 거의 무관.',
  '- 후속: 앞으로 며칠~몇 달 다른 소식·시장·정책에 이어질 일인가. 5 = 큰 후속이 확실, 1 = 오늘로 끝.',
  '',
  '## 주의',
  '- 보도 수(한 곳만 보도했는지)는 점수에 넣지 않습니다. 한 언론만 먼저 보도한 큰 소식도 크게 봅니다.',
  '- 국내 소식이라고 더 높게, 해외 소식이라고 더 낮게 보지 않습니다. 영향의 크기로만 봅니다.',
  '- 빼는 소식(excluded: true): 시상식·행사·후보 발표, 기업 홍보·제품 리뷰, 연예·가십, 단순 인사·동정, 지역 단신, 광고성 기사.',
  '- 여성을 깎아내리거나 대상화하는 것이 기사의 중심인 소식(외모 품평, 성적 대상화, 선정적 가십, 여성혐오 발언을 흥밋거리로 옮긴 기사)도 빼는 소식(excluded: true)입니다. 성차별 · 여성혐오 자체를 문제로 다루는 보도(차별 · 폭력 사건, 제도 개선, 판결 등)는 빼지 않습니다.',
  '- reason은 점수의 근거를 40자 안의 한 줄로 씁니다.',
];

/** 최근 이 분야 뉴스레터에서 다룬 소식 (겹치지 않게 고르는 기준) */
const recentRules = (recentTopics: string[]) =>
  recentTopics.length
    ? [
        '',
        '## 최근 이 분야 뉴스레터에서 이미 다룬 소식',
        ...recentTopics.map((t) => `- ${t}`),
        '',
        '- 위와 같은 사건이면 새 진전(결정·결과·수치 변화·새 국면)이 있을 때만 후속으로 다루고(repeat: false), 새 진전 없이 같은 내용이면 repeat: true로 답합니다.',
        '- 위에 없는 새 사건은 repeat: false.',
      ]
    : ['', '- repeat는 모두 false로 답합니다.'];

// ---------- 1단계: 고르기 (가벼운 모델, 제목과 첫 부분만) ----------

export const SELECT_SYSTEM =
  'You are a senior news editor. You score every story candidly on a fixed rubric so the truly major stories of the day can be picked. Reply in Korean.';

/** 묶음마다 보도 수·언론사·제목·첫 부분만 보낸다 */
export const describeClusters = (clusters: Cluster[]) =>
  clusters
    .map((c, i) => {
      const [top] = c.articles;
      const outlets = [
        ...new Set(c.articles.map((a) => a.source).filter(Boolean)),
      ];
      const at = publishedLabel(top.publishedAt);
      return [
        `[${i + 1}]${isMorning(c) ? ' [오늘 아침]' : ''} 보도 ${c.articles.length}건${outlets.length ? ` (${outlets.join(', ')})` : ''}${at ? ` · ${at}` : ''}`,
        ...c.articles.map((a) => `제목: ${a.title}`),
        `첫 부분: ${top.content.slice(0, LEAD_CHARS)}`,
      ].join('\n');
    })
    .join('\n\n');

/** 오늘 날짜와 날짜 원칙: 지난 일을 오늘 소식처럼 쓰지 않게 (기사마다 보도 시각을 붙인다) */
export const dateRules = (today: Date) => [
  `오늘은 ${kstDayLabel(today)}입니다. 소식마다 보도 시각(월/일 시:분)을 붙였습니다.`,
  "- 기사 속 사건이 어제 이전에 일어난 일이면 '오늘' 일처럼 쓰지 않고 날짜를 밝힙니다 (예: '29일 발표한'). 본문의 '전날' · '지난 ○일'도 오늘 날짜 기준으로 읽습니다.",
];

export const selectPrompt = (
  clusters: Cluster[],
  category?: string,
  recentTopics: string[] = [],
  today: Date = new Date(),
) =>
  [
    ...dateRules(today),
    '- 며칠 전 일을 새 진전 없이 다시 다룬 기사는 새로움 1점입니다.',
    '',
    `어제 아침부터 오늘 아침까지 수집한 ${category ? `${category} 분야 ` : ''}소식 ${clusters.length}개입니다. 뉴스레터에는 이 가운데 정말 주요한 소식 최대 ${LIMITS.stories}개만 싣습니다. 고르는 건 점수 합계로 하므로, 모든 소식(1~${clusters.length}번)에 아래 점수표대로 점수를 매겨 주세요.`,
    ...(clusters.some(isMorning)
      ? [
          `[오늘 아침]이 붙은 소식은 오늘 아침(05시 이후) 보도된 속보입니다. 이 소식들은 본문 소식과 따로, 뉴스레터 맨 위 '오늘 아침 속보'에 최대 ${LIMITS.morning.max}개 짧게 싣습니다. 점수는 같은 점수표로 매기되, 아침 속보끼리 견줍니다.`,
        ]
      : []),
    '',
    ...SCORING_RULES,
    '- 점수마다 title에 그 번호 소식의 첫 제목 앞부분(15자 안팎)을 그대로 옮겨 적습니다. 번호 · 제목 · 점수 · 이유가 같은 소식을 가리키게 합니다.',
    ...(category
      ? [`- ${category} 분야가 아닌 소식은 관심사 1점으로 매깁니다.`]
      : []),
    ...recentRules(recentTopics),
    '',
    describeClusters(clusters),
  ].join('\n');
