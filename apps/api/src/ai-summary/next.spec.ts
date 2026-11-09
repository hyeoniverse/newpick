import { renderNewsletterHtml } from './newsletter-html';
import { LIMITS, normalize, writerPrompt } from './newsletter-writer.service';
import { prepare } from './article-prep';
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

describe('관전 포인트 (소식마다 하나, 후속 지켜보기의 기준)', () => {
  it('쓰기 프롬프트에 소식마다 next를 물음 · 명사구로 쓰라는 지시가 있다', () => {
    const prompt = writerPrompt(prepare([{ title: '기사', content: '본문' }]));
    expect(prompt).toContain('- next: 관전 포인트');
    // 맨 끝 관전 포인트 모음은 소식마다의 것을 모아 만들므로 따로 묻지 않는다
    expect(prompt).not.toContain('- watch:');
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
      '<p class="next"><strong>관전 포인트</strong><span>보우소나루 측 선거 무효 요청이 받아들여질지</span></p><p class="credit">',
    );
    const parsed = parseNewsletterHtml(html);
    expect(parsed.stories[0].next).toBe(
      '보우소나루 측 선거 무효 요청이 받아들여질지',
    );
    expect(parsed.stories[1].next).toBeUndefined();
    // 관전 포인트 모음 = 소식마다의 것. 맨 끝 목록은 따로 두지 않고, 메일용 watch는 소식에서 모은다
    expect(written.watch).toEqual([
      '보우소나루 측 선거 무효 요청이 받아들여질지',
    ]);
    expect(html).not.toContain('<section class="watch">');
    expect(parsed.watch).toEqual([
      '보우소나루 측 선거 무효 요청이 받아들여질지',
    ]);
  });
});
