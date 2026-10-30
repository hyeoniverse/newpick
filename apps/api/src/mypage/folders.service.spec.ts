import { FoldersService } from './folders.service';

function fakePrisma() {
  return {
    folder: {
      findFirst: jest.fn().mockResolvedValue({ id: 9 }),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((args) => Promise.resolve({ id: 9, ...args.data })),
      delete: jest.fn((args) => args),
    },
    highlight: { updateMany: jest.fn((a) => a), deleteMany: jest.fn((a) => a) },
    bookmark: { updateMany: jest.fn((a) => a), deleteMany: jest.fn((a) => a) },
    mailMark: { updateMany: jest.fn((a) => a) },
    $transaction: jest.fn((ops) => Promise.all(ops)),
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

  it('지울 때 안의 것: 기본은 폴더 없음으로, move는 다른 폴더로, delete는 스크랩 · 북마크만 지움(받은 메일은 남김)', async () => {
    const prisma = fakePrisma();
    const service = new FoldersService(prisma as never);
    await service.remove(7, 9);
    expect(prisma.folder.delete).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(prisma.$transaction).not.toHaveBeenCalled();

    await service.remove(7, 9, { contents: 'move', to: 3 });
    const moved = { where: { userId: 7, folderId: 9 }, data: { folderId: 3 } };
    expect(prisma.highlight.updateMany).toHaveBeenCalledWith(moved);
    expect(prisma.bookmark.updateMany).toHaveBeenCalledWith(moved);
    expect(prisma.mailMark.updateMany).toHaveBeenCalledWith(moved);
    expect(prisma.folder.findFirst).toHaveBeenLastCalledWith({
      where: { id: 3, userId: 7 },
      select: { id: true },
    });

    await service.remove(7, 9, { contents: 'delete' });
    const inFolder = { where: { userId: 7, folderId: 9 } };
    expect(prisma.highlight.deleteMany).toHaveBeenCalledWith(inFolder);
    expect(prisma.bookmark.deleteMany).toHaveBeenCalledWith(inFolder);
  });

  it('같은 폴더나 옮길 곳 없이 move면 400, 남의 폴더로는 404', async () => {
    const prisma = fakePrisma();
    const service = new FoldersService(prisma as never);
    await expect(
      service.remove(7, 9, { contents: 'move', to: 9 }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.remove(7, 9, { contents: 'move' }),
    ).rejects.toMatchObject({ status: 400 });
    prisma.folder.findFirst
      .mockResolvedValueOnce({ id: 9 })
      .mockResolvedValueOnce(null);
    await expect(
      service.remove(7, 9, { contents: 'move', to: 4 }),
    ).rejects.toMatchObject({ status: 404 });
    expect(prisma.folder.delete).not.toHaveBeenCalled();
  });
});
