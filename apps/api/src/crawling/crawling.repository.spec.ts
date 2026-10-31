import { CrawlingRepository } from './crawling.repository';

describe('뉴스레터 재료 (getCrawledNewsBetween)', () => {
  it('그 사이에 모았고, 기사도 그 사이에 나온 것만 (헤드라인에 남은 지난 기사는 빼고)', async () => {
    const exec = jest.fn().mockResolvedValue([]);
    const find = jest.fn(() => ({
      sort: () => ({ lean: () => ({ exec }) }),
    }));
    const repository = new CrawlingRepository(
      { find } as never,
      { findById: jest.fn().mockResolvedValue({ name: '경제' }) } as never,
    );
    const start = new Date('2026-10-30T21:00:00Z'); // 10/31 06:00 KST
    const end = new Date('2026-10-31T21:00:00Z');
    await repository.getCrawledNewsBetween(start, end, 1);
    expect(find).toHaveBeenCalledWith({
      createdAt: { $gte: start, $lte: end },
      publishedAt: { $gte: '2026-10-31 06:00:00' },
      category: '경제',
    });
  });
});
