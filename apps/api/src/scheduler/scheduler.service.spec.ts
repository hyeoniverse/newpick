import { Logger } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

function setup(failingCategoryId: number) {
  const categories = [
    { id: 1, name: 'IT' },
    { id: 2, name: '정치' },
    { id: 3, name: '경제' },
  ];
  const crawlingRepository = {
    getCrawledNews: jest.fn(async (_s, _e, categoryId: number) => {
      if (categoryId === failingCategoryId) throw new Error('Mongo timeout');
      return { news: [{ title: `뉴스${categoryId}` }] };
    }),
  };
  const openAiService = {
    summarizeText: jest.fn(async (_news, categoryId: number) => ({
      newsletter: [{ categoryId, content: `요약${categoryId}` }],
    })),
  };
  const service = new SchedulerService(
    new Logger(),
    { sendHtmlMail: jest.fn() } as never,
    openAiService as never,
    {} as never,
    {} as never,
    crawlingRepository as never,
    { findAll: jest.fn().mockResolvedValue(categories) } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, crawlingRepository, openAiService };
}

describe('SchedulerService.makeAiSummary', () => {
  it('카테고리 하나가 실패해도 나머지 카테고리는 요약한다', async () => {
    const { service, openAiService } = setup(2);
    await service.makeAiSummary();
    const summarized = openAiService.summarizeText.mock.calls.map((c) => c[1]);
    expect(summarized).toEqual([1, 3]);
  });

  it('KST 날짜(YYYY-MM-DD)로 지난 7일을 조회한다', async () => {
    const { service, crawlingRepository } = setup(0);
    await service.makeAiSummary();
    const [start, end] = crawlingRepository.getCrawledNews.mock.calls[0];
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
