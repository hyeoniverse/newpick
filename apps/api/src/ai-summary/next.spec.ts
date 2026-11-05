import { renderNewsletterHtml } from './newsletterHtml';
import { LIMITS, normalize, writerPrompt } from './newsletterWriter.service';
import { prepare } from './articlePrep';
import { parseNewsletterHtml } from '../edition/parse';

const story = (next?: string) => ({
  template: 'brief' as const,
  kicker: '대선',
  heading: '룰라 4선',
  lead: '룰라가 4선에 성공했다',
  body: '본문',
  analysis: '',
  stats: [],
  timeline: [],
  qa: [],
  quote: { text: '', by: '' },
  debate: [],
  ...(next !== undefined && { next }),
  sources: [1],
  imageQuery: 'ballot box',
});

describe('다음에 볼 것 (소식마다 후속 지켜보기의 기준)', () => {
  it('쓰기 프롬프트에 소식마다 next를 물음 · 명사구로 쓰라는 지시가 있다', () => {
    const prompt = writerPrompt(prepare([{ title: '기사', content: '본문' }]));
    expect(prompt).toContain('- next: 다음에 볼 것');
    expect(prompt).toContain(`${LIMITS.next}자 이내`);
  });

  it('정리 · HTML · 파싱: 소식 끝 출처 위에 남고, 다시 읽을 수 있다 (없으면 그대로 없음)', () => {
    const written = normalize(
      {
        title: '제목',
        subtitle: '',
        summary: '요약',
        briefing: '',
        stories: [
          story('  보우소나루 측 선거 무효 요청이 받아들여질지 '),
          story(''),
        ],
        watch: [],
        keywords: [],
      },
      (n) => n,
    );
    expect(written.stories[0].next).toBe(
      '보우소나루 측 선거 무효 요청이 받아들여질지',
    );
    const html = renderNewsletterHtml(written, [
      { source: '경향신문', link: 'https://n.news/1' },
    ]);
    expect(html).toContain(
      '<p class="next"><strong>다음에 볼 것</strong><span>보우소나루 측 선거 무효 요청이 받아들여질지</span></p><p class="credit">',
    );
    const parsed = parseNewsletterHtml(html);
    expect(parsed.stories[0].next).toBe(
      '보우소나루 측 선거 무효 요청이 받아들여질지',
    );
    expect(parsed.stories[1].next).toBeUndefined();
  });
});
