import { FoldersService } from './folders.service';

function fakePrisma() {
  return {
    folder: {
      findFirst: jest.fn().mockResolvedValue({ id: 9 }),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((args) => Promise.resolve({ id: 9, ...args.data })),
    },
  };
}

describe('폴더 (#123, 스크랩 · 북마크 · 받은 메일 공통)', () => {
  it('폴더 이름이 겹치면 409, 20개를 넘으면 400', async () => {
    const prisma = fakePrisma();
    const service = new FoldersService(prisma as never);
    await expect(service.create(7, '반도체')).rejects.toMatchObject({
      status: 409,
    });
    prisma.folder.findFirst.mockResolvedValue(null);
    await expect(service.create(7, '반도체')).resolves.toMatchObject({
      name: '반도체',
    });
    prisma.folder.count.mockResolvedValue(20);
    await expect(service.create(7, '금리')).rejects.toMatchObject({
      status: 400,
    });
  });
});
