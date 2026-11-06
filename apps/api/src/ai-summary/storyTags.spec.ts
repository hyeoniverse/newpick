import { renderNewsletterHtml } from './newsletterHtml';
import { mergeTags } from './ai-summary.service';
import {
  LIMITS,
  normalize,
  WRITER_SCHEMA,
  writerPrompt,
} from './newsletterWriter.service';
import { prepare } from './articlePrep';
import { parseNewsletterHtml } from '../edition/parse';
import { tagStories } from '../edition/personalize';
import { sectionTags } from '../mypage/highlights.service';

const story = (heading: string, tags: string[]) => ({
  template: 'brief' as const,
  kicker: '',
  heading,
  lead: `${heading} 리드`,
  body: `${heading} 본문`,
  analysis: '',
  stats: [],
  timeline: [],
  qa: [],
  quote: { text: '', by: '' },
  debate: [],
  next: '',
  tags,
  sources: [1],
  imageQuery: '',
});

describe('소식 태그 (소식마다 1~3개, 뉴스레터 태그는 모아 만든다)', () => {
  it('쓰기: 프롬프트에 소식 tags 지시, 스키마에서 소식마다 필수', () => {
    const prompt = writerPrompt(prepare([{ title: '기사', content: '본문' }]));
    expect(prompt).toContain(
      `- tags: 이 소식의 태그 1~${LIMITS.storyTags.max}개`,
    );
    const storySchema = (
      WRITER_SCHEMA.properties.stories as { items: { required: string[] } }
    ).items;
    expect(storySchema.required).toContain('tags');
  });

  it('정리: # · 중복(대소문자 무시) · 너무 긴 것 빼고 최대 3개', () => {
    const written = normalize(
      {
        title: '제목',
        subtitle: '',
        summary: '요약',
        briefing: '',
        stories: [
          story('룰라 4선', [
            '#룰라',
            '룰라',
            '브라질 대선',
            'Lula',
            'lula',
            '아주아주아주긴태그이름입니다',
            '블루타이드',
          ]),
        ],
        watch: [],
        keywords: ['룰라'],
      },
      (n) => n,
    );
    expect(written.stories[0].tags).toEqual(['룰라', '브라질 대선', 'Lula']);
  });

  it('뉴스레터 태그 = 뉴스레터 태그 + 소식 태그 (뉴스레터 태그 먼저, 중복 없이, 최대 10개)', () => {
    expect(
      mergeTags(['코스피', '룰라'], ['룰라', '브라질 대선', 'CPTPP', '코스피']),
    ).toEqual(['코스피', '룰라', '브라질 대선', 'CPTPP']);
    expect(
      mergeTags(
        [],
        Array.from({ length: 14 }, (_, i) => `태그${i}`),
      ),
    ).toHaveLength(10);
  });

  it('HTML에 속성(data-tags)으로 남고 화면에는 그리지 않는다, 다시 읽으면 소식 태그', () => {
    const html = renderNewsletterHtml(
      {
        briefing: '',
        stories: [
          story('룰라 4선', ['룰라', '브라질 대선']),
          story('코스피', []),
        ],
        watch: [],
      },
      [],
    );
    expect(html).toContain(
      '<article class="story story-brief" data-tags="룰라|브라질 대선">',
    );
    expect(html).toContain(
      '<article class="story story-brief"><p class="kicker">',
    );
    const parsed = parseNewsletterHtml(html);
    expect(parsed.stories.map((s) => s.tags)).toEqual([
      ['룰라', '브라질 대선'],
      undefined,
    ]);
    // 스크랩 블록 태그: 소식 태그가 있으면 그것, 없으면 글에 나오는 뉴스레터 태그
    expect(sectionTags(html, ['코스피', '룰라'])).toEqual([
      ['룰라', '브라질 대선'],
      ['코스피'],
    ]);
  });

  it("메일 '팔로우한 태그': 소식 태그가 있으면 그것으로만 (글에 단어가 스쳐도 다른 소식은 안 걸린다)", () => {
    const html = renderNewsletterHtml(
      {
        briefing: '',
        stories: [
          story('룰라 4선', ['룰라']),
          {
            ...story('코스피 급락', ['코스피']),
            body: '룰라 당선 소식도 영향',
          },
        ],
        watch: [],
      },
      [],
    );
    const sources = [
      {
        newsletterId: 10,
        categoryId: 3,
        category: '세계',
        title: '세계',
        stories: parseNewsletterHtml(html).stories,
      },
    ];
    const found = tagStories(sources as never, [{ name: '룰라', key: '룰라' }]);
    expect(found.get('룰라')?.map((s) => s.heading)).toEqual(['룰라 4선']);
  });
});
