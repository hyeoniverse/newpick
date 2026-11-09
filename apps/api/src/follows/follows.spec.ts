import { renderNewsletterHtml } from '../ai-summary/newsletter-html';
import { AiUnavailable } from '../ai/ai.service';
import {
  acceptedFrom,
  candidatesFor,
  FOLLOW_LIMITS,
  judgePrompt,
} from './detect';
import { FollowsService } from './follows.service';

const story = (heading: string) => ({
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
  sources: [],
  imageQuery: '',
});
const html = (...headings: string[]) =>
  renderNewsletterHtml({
    briefing: '',
    stories: headings.map(story),
    watch: [],
  });

describe('후속 판정 규칙', () => {
  const follow = {
    id: 1,
    newsletterId: 10,
    heading: '더존비즈온 사고',
    text: '',
    vector: [1, 0, 0],
  };
  const fresh = (newsletterId: number, vector: number[], heading = 'x') => ({
    newsletterId,
    storyIndex: 1,
    category: 'IT',
    heading,
    text: '',
    vector,
  });

  it(`비슷한(${FOLLOW_LIMITS.candidate} 이상) 다른 뉴스레터 소식만 후보, 비슷한 순 최대 ${FOLLOW_LIMITS.perFollow}개`, () => {
    const result = candidatesFor(follow, [
      fresh(10, [1, 0, 0], '같은 뉴스레터'),
      fresh(20, [0.6, 0.8, 0], '0.6'),
      fresh(21, [0.9, 0.43, 0], '0.9'),
      fresh(22, [0, 1, 0], '다른 주제'),
      fresh(23, [0.8, 0.6, 0], '0.8'),
      fresh(24, [0.7, 0.71, 0], '0.7'),
    ]);
    expect(result.map((c) => c.story.heading)).toEqual(['0.9', '0.8', '0.7']);
  });

  it('판정 결과에서 후속(true)만, 없는 번호 · 중복은 빼고 이유는 한 줄로', () => {
    expect(
      acceptedFrom(
        {
          results: [
            { n: 1, follow: true, reason: ' 조사단이\n침투 경로를 확인했다 ' },
            { n: 2, follow: false, reason: '' },
            { n: 1, follow: true, reason: '중복' },
            { n: 9, follow: true, reason: '없는 번호' },
          ],
        },
        2,
      ),
    ).toEqual([{ index: 0, reason: '조사단이 침투 경로를 확인했다' }]);
    expect(acceptedFrom(null, 2)).toEqual([]);
  });

  it('프롬프트: 같은 사건의 새 진전만, 비슷한 주제의 다른 일은 아님', () => {
    const prompt = judgePrompt(
      { heading: '더존비즈온 사고', text: '침해사고' },
      [{ story: { heading: '조사 결과', text: '침투 경로', category: 'IT' } }],
    );
    expect(prompt).toContain('[1] (IT) 조사 결과');
    expect(prompt).toContain('같은 사건 · 사안의 새 진전일 때만');
    expect(prompt).toContain('비슷한 주제의 다른 일이면 false');
  });
});

describe('FollowsService', () => {
  const setup = () => {
    const prisma = {
      newsletter: { findUnique: jest.fn(), findMany: jest.fn() },
      storyFollow: {
        upsert: jest.fn().mockResolvedValue({ id: 1, storyIndex: 2 }),
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      followUpdate: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const ai = { embed: jest.fn(), generate: jest.fn() };
    const service = new FollowsService(prisma as never, ai as never);
    return { prisma, ai, service };
  };

  it('지켜보기: 그 소식의 제목 · 글을 남긴다, 없는 소식이면 404', async () => {
    const { prisma, service } = setup();
    prisma.newsletter.findUnique.mockResolvedValue({
      contentAsHTML: html('첫 소식', '더존비즈온 사고'),
    });
    await service.follow(7, 10, 2);
    const { create } = prisma.storyFollow.upsert.mock.calls[0][0];
    expect(create).toMatchObject({
      userId: 7,
      newsletterId: 10,
      storyIndex: 2,
      heading: '더존비즈온 사고',
    });
    expect(create.text).toContain('더존비즈온 사고 리드');
    await expect(service.follow(7, 10, 5)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('메일에 실을 후속: 사람마다 최근 것부터 최대 개수까지, since 이후만', async () => {
    const { prisma, service } = setup();
    const row = (userId: number, heading: string) => ({
      heading,
      reason: '이어짐',
      newsletterId: 69,
      follow: { userId, heading: '룰라 4선', newsletterId: 63 },
      newsletter: { category: { name: '세계' } },
    });
    (
      prisma as never as { followUpdate: { findMany: jest.Mock } }
    ).followUpdate.findMany = jest
      .fn()
      .mockResolvedValue([
        ...Array.from({ length: FOLLOW_LIMITS.mail + 2 }, (_, i) =>
          row(7, `후속 ${i}`),
        ),
        row(8, '다른 사람 후속'),
      ]);
    const since = new Date('2026-10-26T21:00:00Z');
    const result = await service.forMail([7, 8], since);
    expect(result.get(7)).toHaveLength(FOLLOW_LIMITS.mail);
    expect(result.get(7)![0]).toEqual({
      followed: '룰라 4선',
      followedNewsletterId: 63,
      heading: '후속 0',
      reason: '이어짐',
      newsletterId: 69,
      category: '세계',
    });
    expect(result.get(8)!.map((f) => f.heading)).toEqual(['다른 사람 후속']);
    const { where } = (
      prisma as never as { followUpdate: { findMany: jest.Mock } }
    ).followUpdate.findMany.mock.calls[0][0];
    expect(where).toEqual({
      createdAt: { gte: since },
      follow: { userId: { in: [7, 8] } },
    });
  });

  it("지켜보기: '관전 포인트'가 있으면 판정 글 맨 앞에 둔다", async () => {
    const { prisma, service } = setup();
    prisma.newsletter.findUnique.mockResolvedValue({
      contentAsHTML: renderNewsletterHtml({
        briefing: '',
        stories: [
          { ...story('룰라 4선'), next: '선거 무효 요청이 받아들여질지' },
        ],
        watch: [],
      }),
    });
    await service.follow(7, 10, 1);
    const { create } = prisma.storyFollow.upsert.mock.calls[0][0];
    expect(create.text.split('\n')[0]).toBe(
      '관전 포인트: 선거 무효 요청이 받아들여질지',
    );
  });

  it('지켜보는 소식이 없으면 아무것도 부르지 않는다', async () => {
    const { prisma, ai, service } = setup();
    prisma.storyFollow.findMany.mockResolvedValue([]);
    expect(await service.detect('2026-10-31')).toEqual({
      follows: 0,
      checked: 0,
      updates: 0,
    });
    expect(ai.embed).not.toHaveBeenCalled();
    expect(prisma.newsletter.findMany).not.toHaveBeenCalled();
  });

  const today = () => [
    {
      id: 30,
      contentAsHTML: html('더존비즈온 침투 경로 확인', '야구 결과'),
      category: { name: 'IT' },
    },
  ];

  it('후보를 판정해 후속만 쌓고, 지켜보는 소식의 임베딩은 한 번 계산해 둔다', async () => {
    const { prisma, ai, service } = setup();
    prisma.storyFollow.findMany.mockResolvedValue([
      {
        id: 1,
        newsletterId: 10,
        heading: '더존비즈온 사고',
        text: '침해사고',
        embedding: null,
      },
    ]);
    prisma.newsletter.findMany.mockResolvedValue(today());
    ai.embed
      .mockResolvedValueOnce([
        [1, 0],
        [0, 1],
      ]) // 오늘 소식 2개
      .mockResolvedValueOnce([[0.95, 0.31]]); // 지켜보는 소식
    ai.generate.mockResolvedValue({
      text: JSON.stringify({
        results: [{ n: 1, follow: true, reason: '침투 경로를 확인했다' }],
      }),
    });

    expect(await service.detect('2026-10-31')).toEqual({
      follows: 1,
      checked: 1,
      updates: 1,
    });
    expect(prisma.storyFollow.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { embedding: [0.95, 0.31] },
    });
    expect(ai.generate.mock.calls[0][0]).toMatchObject({
      prefer: 'open',
      fallback: false,
    });
    expect(prisma.followUpdate.createMany).toHaveBeenCalledWith({
      skipDuplicates: true,
      data: [
        {
          followId: 1,
          newsletterId: 30,
          storyIndex: 1,
          heading: '더존비즈온 침투 경로 확인',
          reason: '침투 경로를 확인했다',
        },
      ],
    });
  });

  it(`판정을 못 하는 날(할당 초과)은 아주 비슷한(${FOLLOW_LIMITS.autoAccept} 이상) 것만`, async () => {
    const { prisma, ai, service } = setup();
    prisma.storyFollow.findMany.mockResolvedValue([
      {
        id: 1,
        newsletterId: 10,
        heading: '사고',
        text: '사고',
        embedding: [1, 0],
      },
    ]);
    prisma.newsletter.findMany.mockResolvedValue(today());
    // 0.8(받아들임) · 0.6(후보지만 판정 없이는 안 받음)
    ai.embed.mockResolvedValueOnce([
      [0.8, 0.6],
      [0.6, 0.8],
    ]);
    ai.generate.mockRejectedValue(new AiUnavailable('429'));

    await service.detect('2026-10-31');
    expect(prisma.followUpdate.createMany.mock.calls[0][0].data).toEqual([
      expect.objectContaining({ storyIndex: 1, reason: '' }),
    ]);
  });

  it('임베딩을 못 하면 오늘은 건너뛴다 (실패를 던지지 않음)', async () => {
    const { prisma, ai, service } = setup();
    prisma.storyFollow.findMany.mockResolvedValue([
      {
        id: 1,
        newsletterId: 10,
        heading: '사고',
        text: '사고',
        embedding: [1, 0],
      },
    ]);
    prisma.newsletter.findMany.mockResolvedValue(today());
    ai.embed.mockRejectedValue(new AiUnavailable('429'));
    expect(await service.detect('2026-10-31')).toEqual({
      follows: 1,
      checked: 0,
      updates: 0,
    });
    expect(prisma.followUpdate.createMany).not.toHaveBeenCalled();
  });

  it(`마이페이지: 지켜보기 시작 · 마지막 후속 · '계속 지켜보기'로부터 ${FOLLOW_LIMITS.quietDays}일 넘게 조용하면 quiet`, async () => {
    const { prisma, service } = setup();
    const daysAgo = (n: number) =>
      new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const row = (
      id: number,
      createdAt: Date,
      keptAt: Date | null,
      updates: Date[],
    ) => ({
      id,
      heading: `소식 ${id}`,
      storyIndex: 1,
      createdAt,
      keptAt,
      newsletter: { id: 1, createdAt, category: { name: 'IT' } },
      updates: updates.map((d, i) => ({ id: i, createdAt: d, seenAt: d })),
    });
    prisma.storyFollow.findMany.mockResolvedValue([
      row(1, daysAgo(40), null, []),
      row(2, daysAgo(40), null, [daysAgo(10)]),
      row(3, daysAgo(40), daysAgo(5), []),
      row(4, daysAgo(10), null, []),
    ]);
    const list = await service.list(7);
    expect(list.map((f) => [f.id, f.quiet])).toEqual([
      [1, true],
      [2, false],
      [3, false],
      [4, false],
    ]);
    expect(list[0]).not.toHaveProperty('keptAt');
  });

  it('계속 지켜보기: 내 것만, 없으면 404', async () => {
    const { prisma, service } = setup();
    await service.keep(7, 3);
    expect(prisma.storyFollow.updateMany).toHaveBeenCalledWith({
      where: { id: 3, userId: 7 },
      data: { keptAt: expect.any(Date) },
    });
    prisma.storyFollow.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.keep(7, 99)).rejects.toThrow();
  });

  it('판정할 지켜보기: 시작 · 계속 지켜보기 · 후속 중 하나라도 최근이면', async () => {
    const { prisma, service } = setup();
    prisma.storyFollow.findMany.mockResolvedValue([]);
    await service.detect('2026-10-31');
    const { where } = prisma.storyFollow.findMany.mock.calls[0][0];
    expect(
      Object.keys(
        where.OR.reduce((a: object, b: object) => ({ ...a, ...b }), {}),
      ),
    ).toEqual(['createdAt', 'keptAt', 'updates']);
  });
});
