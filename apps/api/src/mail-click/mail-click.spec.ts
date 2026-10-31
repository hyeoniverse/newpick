import { renderEditionMail } from '../edition/mail';
import { MailClickController } from './mail-click.controller';
import { createMailLinkToken, verifyMailLinkToken } from './mail-link';

const link = {
  url: 'https://n.news.naver.com/article/1?x=1',
  day: '2026-10-31',
  personal: true,
  kind: 'source' as const,
};

describe('메일 링크 토큰', () => {
  it('서명이 맞으면 그대로 돌려준다 (누가 눌렀는지는 없다)', () => {
    const token = createMailLinkToken(link);
    expect(verifyMailLinkToken(token)).toEqual(link);
    expect(token).not.toMatch(/@/);
  });

  it('주소를 바꾸거나 서명이 틀리면 거절한다 (아무 주소로나 보내는 데 못 쓴다)', () => {
    const token = createMailLinkToken(link);
    const [, signature] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({
        u: 'https://evil.example',
        d: link.day,
        p: 1,
        k: 'source',
      }),
    ).toString('base64url');
    expect(verifyMailLinkToken(`${forged}.${signature}`)).toBeNull();
    expect(verifyMailLinkToken(`${token}x`)).toBeNull();
    expect(verifyMailLinkToken('nope')).toBeNull();
    expect(verifyMailLinkToken(undefined)).toBeNull();
  });

  it('웹 주소가 아니면 서명이 맞아도 거절한다', () => {
    expect(
      verifyMailLinkToken(
        createMailLinkToken({ ...link, url: 'javascript:alert(1)' }),
      ),
    ).toBeNull();
  });
});

describe('GET /r/:token', () => {
  const setup = (create = jest.fn().mockResolvedValue({})) => {
    const res = { redirect: jest.fn() };
    const controller = new MailClickController({
      mailClick: { create },
    } as never);
    return { controller, res, create };
  };

  it('세고 원래 주소로 보낸다', async () => {
    const { controller, res, create } = setup();
    await controller.go(createMailLinkToken(link), res as never);
    expect(create).toHaveBeenCalledWith({
      data: { day: '2026-10-31', personal: true, kind: 'source' },
    });
    expect(res.redirect).toHaveBeenCalledWith(302, link.url);
  });

  it('기록이 실패해도 보낸다, 서명이 틀리면 세지 않고 첫 화면으로', async () => {
    const failing = setup(jest.fn().mockRejectedValue(new Error('db down')));
    await failing.controller.go(
      createMailLinkToken(link),
      failing.res as never,
    );
    expect(failing.res.redirect).toHaveBeenCalledWith(302, link.url);

    const bad = setup();
    process.env.FRONTEND_URL = 'https://newpick.example';
    await bad.controller.go('nope', bad.res as never);
    expect(bad.create).not.toHaveBeenCalled();
    expect(bad.res.redirect).toHaveBeenCalledWith(
      302,
      'https://newpick.example',
    );
  });
});

describe('메일 링크 감싸기', () => {
  const edition = {
    dateLabel: '10월 31일',
    subject: '제목',
    categories: ['경제'],
    top: [],
    threads: [],
    sections: [
      {
        category: '경제',
        newsletterId: 7,
        title: '경제',
        stories: [
          {
            ref: '7-1',
            alsoIn: [],
            story: {
              kicker: '',
              heading: '코스피',
              lead: '',
              blocks: [],
              sources: [{ text: '연합뉴스', url: 'https://n.news/1' }],
            },
          },
        ],
      },
    ],
    watch: [],
    newsletterIds: [7],
    articles: [
      {
        title: '추천',
        link: 'https://n.news/2',
        source: '한경',
        category: '경제',
        score: 0.7,
      },
    ],
  };

  it('발송: 뉴스레터 · 원문 · 추천 기사 링크만 감싸고, 수신 거부 · 약관은 그대로', () => {
    const kinds: string[] = [];
    const mail = renderEditionMail(
      edition as never,
      'https://newpick.example',
      '',
      'https://newpick.example/unsubscribe?token=t',
      (url, kind) => {
        kinds.push(kind);
        return `https://newpick.example/api/r/${kind}`;
      },
    );
    expect(kinds.sort()).toEqual(['article', 'newsletter', 'source']);
    expect(mail).not.toContain('href="https://n.news/1"');
    expect(mail).toContain(
      'href="https://newpick.example/unsubscribe?token=t"',
    );
    expect(mail).toContain('href="https://newpick.example/terms"');
  });

  it('미리보기 · 다시 보기(감쌀 함수 없음)는 원래 주소 그대로', () => {
    const mail = renderEditionMail(edition as never, 'https://newpick.example');
    expect(mail).toContain('href="https://n.news/1"');
    expect(mail).not.toContain('/api/r/');
  });
});
