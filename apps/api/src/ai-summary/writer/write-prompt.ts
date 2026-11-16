import { PrepArticle, publishedLabel } from '../article-prep';
import { GENDER_RULES } from '../writing-rules';
import { dateRules } from './select-prompt';
import { isDebateCategory, LIMITS, TEMPLATES } from './types';

/** 2단계 쓰기 프롬프트 (기본 모델, 고른 소식의 기사만) */

// ---------- 2단계: 쓰기 (기본 모델, 고른 소식의 기사만) ----------

export const WRITER_SYSTEM =
  'You are the chief editor of a Korean expert news briefing read by professionals. You write precise, analytical Korean.';

/** 쓰기 단계 입력. 번호는 이 목록 안에서의 번호다 (저장 전에 원래 번호로 바꾼다) */
export const numberArticles = (articles: PrepArticle[]) =>
  articles
    .map(
      (a, i) =>
        `[${i + 1}]${a.source ? ` (${a.source}${a.publishedAt ? ` · ${publishedLabel(a.publishedAt)}` : ''})` : ''} ${a.title}\n${a.content}`,
    )
    .join('\n\n');

export const writerPrompt = (
  articles: PrepArticle[],
  category?: string,
  existingTags: string[] = [],
  recentTopics: string[] = [],
  today: Date = new Date(),
  /** 오늘 아침 속보로 고른 기사 (번호는 본문 기사 다음에 이어진다) */
  morning: PrepArticle[] = [],
) =>
  [
    ...dateRules(today),
    '',
    `아래 ${category ? `${category} 분야 ` : ''}기사 ${articles.length}건은 오늘 뉴스레터에 실을 소식으로 이미 고른 것입니다. 이걸로 전문가용 뉴스 브리핑 한 편을 써 주세요. 같은 사건을 다룬 기사는 한 소식으로 합칩니다.`,
    ...(morning.length
      ? [
          `그 뒤의 기사 ${morning.length}건(${articles.length + 1}~${articles.length + morning.length}번)은 오늘 아침(05시 이후) 보도된 속보입니다. 이 기사로 쓴 소식은 stories 맨 앞에 두고 morning을 true로 표시합니다.`,
        ]
      : []),
    '',
    '## 문체',
    '- 증권사·연구소 애널리스트 브리핑처럼 간결한 평서체(~다)로 씁니다. 감탄, 과장, 구어체, 이모지는 쓰지 않습니다.',
    '- 첫 문장에 사실(누가, 무엇을, 얼마나)을 쓰고 이어서 맥락을 씁니다. 형용사보다 수치와 근거를 씁니다.',
    '- 전문 용어는 그대로 쓰되, 처음 나올 때 괄호로 짧게 풉니다.',
    `- 강조: body·analysis·qa의 답(a)에서 독자가 꼭 기억할 핵심 구절(결정적 수치, 결론, 변화)을 ==구절==로 감쌉니다. 소식마다 1~${LIMITS.marks.max}곳(모든 소식에 최소 1곳), 한 곳은 ${LIMITS.marks.length}자 이내. 문장 전체가 아니라 핵심 구절만 감싸고, 다른 항목에는 쓰지 않습니다.`,
    '',
    '## 성차별 · 여성혐오',
    ...GENDER_RULES,
    '- 이 원칙은 아래 debate에도 같습니다: 차별 · 혐오 주장과 그 해명은 대등한 한쪽 주장으로 싣지 않습니다. 차별 · 혐오가 쟁점인 소식은 debate를 빈 배열로 둡니다.',
    '',
    '## 항목',
    `- title: 가장 중요한 소식 하나를 담은 헤드라인. ${LIMITS.title}자 이내, 기사 제목 형식. 여러 소식을 ·, 쉼표, "외"로 나열하지 않고, 날짜·"주요 소식"·"브리핑" 같은 말은 넣지 않습니다.`,
    `- subtitle: 나머지 소식을 한 문장으로. ${LIMITS.subtitle}자 이내. 소식이 하나뿐이면 그 소식의 의미를 한 문장으로.`,
    `- summary: 소식마다 핵심을 한 문장씩, stories 순서대로(오늘 아침 속보가 먼저) 빠짐없이 이어 씁니다 (소식 하나에 문장 하나, 문장 끝은 마침표). 모두 ${LIMITS.summary}자 이내. 상세 화면 위 요약 상자가 문장마다 한 줄로 보여 줍니다.`,
    `- briefing: 에디터 브리핑. 오늘 소식들을 관통하는 흐름이나 공통 변수를 2~3문장, ${LIMITS.briefing}자 이내로. 소식 목록을 다시 나열하지 않습니다.`,
    '- stories: 소식마다 morning(오늘 아침 속보 기사로 쓴 소식이면 true, 아니면 false)을 표시하고, 내용에 맞는 template을 하나 고르고, 그 템플릿의 고유 항목만 채웁니다. 나머지 고유 항목은 빈 배열·빈 문자열로 둡니다. 소식이 여러 개면 가능한 한 서로 다른 템플릿을 씁니다.',
    `  - template: ${TEMPLATES.join(' | ')}`,
    `    - numbers: 증시·경제지표·통계 발표처럼 숫자가 핵심인 소식 → stats ${LIMITS.stats.min}~${LIMITS.stats.max}개 (label: 지표 이름 12자 이내, value: 값 12자 이내 예 "5,469.47", note: 변화·비교 20자 이내 예 "-1.46%" 또는 "4월 6일 이후 최저", 등락은 반드시 +/- 부호를 붙인다)`,
    `    - timeline: 수사·재판·외교·사고처럼 단계적으로 진행 중인 사건 → timeline ${LIMITS.timeline.min}~${LIMITS.timeline.max}개 (when: 날짜·시점 12자 이내, what: 그때 일어난 일 50자 이내), 시간 순서대로`,
    `    - qa: 정책·제도·규제·세제 변화 → qa ${LIMITS.qa.min}~${LIMITS.qa.max}개 (q: "무엇이 바뀌나", "누가 영향을 받나", "언제부터" 같은 질문 30자 이내, a: 답 120자 이내)`,
    '    - quote: 핵심이 누군가의 발언인 소식 → quote (text: 기사에 나온 발언 그대로 80자 이내, by: 발언자와 직함 20자 이내)',
    '    - analysis: 위에 해당하지 않는 일반 소식',
    `    - brief: 짧게 다뤄도 되는 소식. body ${LIMITS.briefBody.min}~${LIMITS.briefBody.max}자, analysis는 빈 문자열`,
    `  - kicker: 주제 꼬리표 ${LIMITS.kicker}자 이내 (예: 증시, 세제, 사이버보안).`,
    '  - heading: 기사 제목 형식, 25자 이내.',
    `  - lead: 리드. 핵심 사실 한 문장, ${LIMITS.lead}자 이내.`,
    `  - body: 경과와 맥락 ${LIMITS.body.min}~${LIMITS.body.max}자, 문단 1~2개. 문단 사이는 빈 줄 하나. 템플릿 고유 항목(stats·timeline·qa·quote)과 같은 내용을 반복하지 않습니다.`,
    `  - analysis: 시사점 ${LIMITS.analysis.min}~${LIMITS.analysis.max}자. 파급 효과, 이해관계자, 쟁점, 전망. 기사에 근거가 없는 예측은 하지 않습니다.`,
    `  - debate: 엇갈린 주장. 같은 사안을 두고 기사에 **서로 반대되는 주장**이 있을 때만 (한쪽은 A라고 하고 다른 쪽은 A가 아니라고 하거나, 같은 일을 정반대로 평가할 때. 예: 여당은 "적법한 절차" · 야당은 "권한 남용"). 주장하는 쪽마다 하나씩 2~${LIMITS.debate.max}개 (side: 주장하는 쪽 — 정당 · 기관 · 인물, 사설이나 칼럼이면 그 언론사 / claim: 그쪽 주장 ${LIMITS.debate.claim}자 이내 / source: 그 주장이 실린 기사의 언론사 이름 그대로). 강조점만 다르거나, 같은 사실을 다르게 전할 뿐이거나, 한쪽 주장만 있으면 빈 배열. 양쪽을 같은 길이 · 같은 어조로 쓰고 어느 편도 들지 않으며, 기사에 없는 주장은 지어내지 않습니다.`,
    `  - next: 관전 포인트. 이 소식에서 앞으로 지켜볼 일정 · 결정 · 변수 하나를 ${LIMITS.next}자 이내의 물음이나 명사구로 (예: "보우소나루 측 선거 무효 요청이 받아들여질지", "공모가와 공모 주식 수 확정"). 기사에 나온 일정 · 변수만 쓰고, 마땅한 일정이 없으면 이 일의 다음 진전이 나올 지점을 씁니다. 독자는 이것을 보고 후속 소식을 받을지 정합니다.`,
    `  - tags: 이 소식의 태그 1~${LIMITS.storyTags.max}개, 하나에 ${LIMITS.keywords.length}자 이내. 이 소식을 찾을 때 쓸 고유명사·주제어(예: 룰라, 브라질 대선). # 기호와 분야 이름은 넣지 않습니다. 아래 keywords와 같은 표기를 씁니다.`,
    '  - sources: 이 소식의 근거 기사 번호 (가장 대표적인 기사를 먼저).',
    '  - imageQuery: 이 소식에 어울리는 사진 검색어. 영어 2~4단어. 사람이 나오지 않는 사물·풍경 위주로 (자료 사진 속 인물이 기사 속 인물로 오해받지 않게). 실존 인물 이름·기업 로고 금지 (예: "stock market screen", "farmland korea", "ballot box").',
    ...(morning.length
      ? [
          `- 오늘 아침 속보 ${Math.min(morning.length, LIMITS.morning.max)}개: 속보 기사(${articles.length + 1}번부터)마다 소식 하나를 본문 소식과 **같은 형식**으로 써서 stories 맨 앞에 넣고 morning을 true로 합니다 (template 고르기 · body · 템플릿 고유 항목 · analysis · next 등 모두 위 규칙 그대로, 본문 소식 ${LIMITS.stories}개와 별개). 막 알려진 일이라 기사에 없는 내용을 더하지 말고, next(관전 포인트)는 이어질 발표 · 결과를 씁니다. 본문 기사로 쓴 사건은 넣지 않습니다.`,
        ]
      : ['- 오늘 아침 속보가 없으니 모든 소식의 morning은 false입니다.']),
    `- keywords: 이 뉴스레터의 핵심 키워드 ${LIMITS.keywords.min}~${LIMITS.keywords.max}개 (소식 tags 중 중요한 것 포함), 하나에 ${LIMITS.keywords.length}자 이내. 독자가 검색할 만한 고유명사·주제어(예: 코스피, 가상자산 과세, CPTPP). # 기호와 분야 이름 자체는 넣지 않고, 중요한 순서로.`,
    ...(isDebateCategory(category)
      ? [
          `- ${category} 분야는 같은 사안을 두고 주장이 맞서는 경우가 많습니다. 여러 기사(언론사)를 비교해 서로 반대되는 주장이 있으면 debate를 채우고, body · analysis도 한쪽 주장만 따르지 않게 씁니다.`,
        ]
      : []),
    ...(existingTags.length
      ? [
          `- keywords는 같은 대상·주제면 이미 쓰고 있는 태그 표기를 그대로 다시 씁니다 (띄어쓰기·영문 표기까지 같게). 정말 새로운 대상일 때만 새 태그를 만듭니다. 이미 쓰는 태그: ${existingTags.join(', ')}`,
        ]
      : []),
    ...(recentTopics.length
      ? [
          `- 최근 이 분야에서 다룬 소식: ${recentTopics.join(' / ')}. 이와 이어지는 소식이면 이전 내용을 되풀이하지 말고 새로 달라진 점을 중심으로 씁니다.`,
        ]
      : []),
    '- 숫자·이름·날짜는 기사에 있는 그대로 쓰고, 기사에 없는 내용은 더하지 않습니다.',
    '- 마크다운, HTML, 글머리 기호 문자(-, •)는 쓰지 않습니다. 따옴표로 제목을 감싸지 않습니다.',
    '',
    '## 기사',
    numberArticles([...articles, ...morning]),
  ].join('\n');
