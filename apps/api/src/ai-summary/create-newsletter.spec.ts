import { Logger } from '@nestjs/common';
import { CreateNewsletterService } from './create-newsletter.service';

describe('CreateNewsletterService', () => {
  const setup = () => {
    const prisma = {
      newsletter: {
        create: jest.fn().mockResolvedValue({ id: 99 }),
        update: jest.fn().mockResolvedValue({ id: 86 }),
      },
      highlight: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    const service = new CreateNewsletterService(prisma as never, new Logger());
    return { service, prisma };
  };
  const args: [
    string,
    string,
    string,
    string,
    number,
    string,
    string,
    string[],
  ] = ['제목', '부제', '요약', 'l1,l2', 3, '<div/>', 'i.jpg', ['코스피']];

  it('보통은 새로 만들고, 발행 시각을 주면 그 시각으로', async () => {
    const { service, prisma } = setup();
    const at = new Date('2026-11-08T08:30:00+09:00');
    await service.createNewsletter(...args, at);
    expect(prisma.newsletter.create.mock.calls[0][0].data.createdAt).toBe(at);
    expect(prisma.newsletter.update).not.toHaveBeenCalled();
  });

  it('다시 쓰기는 그 뉴스레터를 바꾸고(발행일 · 분야 · 조회수 그대로), 스크랩에 꺼내 둔 소식 정보를 비운다', async () => {
    const { service, prisma } = setup();
    await service.createNewsletter(...args, new Date(), 86);
    expect(prisma.newsletter.create).not.toHaveBeenCalled();
    const { where, data } = prisma.newsletter.update.mock.calls[0][0];
    expect(where).toEqual({ id: 86 });
    expect(data).toMatchObject({
      title: '제목',
      contentAsHTML: '<div/>',
      usedNews: 'l1,l2',
    });
    expect(data).not.toHaveProperty('createdAt');
    expect(data).not.toHaveProperty('categoryId');
    expect(data).not.toHaveProperty('viewcount');
    expect(prisma.highlight.updateMany.mock.calls[0][0].where).toEqual({
      newsletterId: 86,
    });
  });
});
