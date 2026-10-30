import { NewsletterRepo } from './newsletter.repository';

describe('뉴스레터 고치기', () => {
  const fakePrisma = () => ({
    newsletter: { update: jest.fn().mockResolvedValue({ id: 66 }) },
    highlight: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  });

  it('본문을 고치면 스크랩에 꺼내 둔 소식 제목을 비운다 (다음 목록에서 새 본문으로 다시 꺼냄)', async () => {
    const prisma = fakePrisma();
    await new NewsletterRepo(prisma as never).updateNewsletter(66, {
      contentAsHTML: '<p>새 본문</p>',
    });
    expect(prisma.highlight.updateMany).toHaveBeenCalledWith({
      where: { newsletterId: 66 },
      data: { sectionTitle: null },
    });
  });

  it('본문 말고 제목만 고치면 그대로 둔다', async () => {
    const prisma = fakePrisma();
    await new NewsletterRepo(prisma as never).updateNewsletter(66, {
      title: '새 제목',
    });
    expect(prisma.highlight.updateMany).not.toHaveBeenCalled();
  });
});
