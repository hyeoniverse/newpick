import { sanitizeNewsletterHtml } from './sanitize-newsletter-html';

describe('뉴스레터 본문 HTML 정리 (#31)', () => {
  it('템플릿 태그 · class는 남긴다', () => {
    const html =
      '<section class="story"><h3 class="heading">제목</h3><p class="lead">리드 <mark>강조</mark></p></section>';
    expect(sanitizeNewsletterHtml(html)).toBe(html);
  });

  it('script · on* 속성 · javascript: 링크 · http 사진은 지운다', () => {
    const out = sanitizeNewsletterHtml(
      '<p onclick="x()">글</p><script>alert(1)</script><a href="javascript:alert(1)">링크</a><img src="http://a.com/x.png"><img src="https://a.com/y.png" onerror="x()">',
    );
    expect(out).toBe(
      '<p>글</p><a>링크</a><img><img src="https://a.com/y.png">',
    );
  });

  it('허용 밖 태그는 껍데기만 벗기고 글자는 남긴다, 주석은 지운다', () => {
    expect(
      sanitizeNewsletterHtml(
        '<p><font color="red">빨강</font><!-- 메모 --></p>',
      ),
    ).toBe('<p>빨강</p>');
  });

  it('새 창 링크에는 noopener', () => {
    expect(
      sanitizeNewsletterHtml(
        '<a href="https://n.news.naver.com" target="_blank">원문</a>',
      ),
    ).toBe(
      '<a href="https://n.news.naver.com" target="_blank" rel="noopener noreferrer">원문</a>',
    );
  });
});
