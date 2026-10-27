import { SiteCacheService } from './site-cache.service';

describe('SiteCacheService (#73)', () => {
  const env = { ...process.env };
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://newpick.example.com/';
    process.env.REVALIDATE_SECRET = 'secret';
    fetchMock.mockReset();
    global.fetch = fetchMock as never;
  });
  afterAll(() => {
    process.env = env;
  });

  it('웹의 /api/revalidate를 비밀 값 헤더와 함께 부른다', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await expect(new SiteCacheService().refresh('테스트')).resolves.toEqual({
      ok: true,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://newpick.example.com/api/revalidate');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'x-revalidate-secret': 'secret' });
  });

  it('비밀 값이 없으면 부르지 않고 not-configured', async () => {
    delete process.env.REVALIDATE_SECRET;
    await expect(new SiteCacheService().refresh('테스트')).resolves.toEqual({
      ok: false,
      reason: 'not-configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('웹이 실패하거나 연결이 안 돼도 던지지 않고 failed', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(new SiteCacheService().refresh('a')).resolves.toMatchObject({
      ok: false,
      reason: 'failed',
      detail: '웹 응답 401',
    });
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(new SiteCacheService().refresh('b')).resolves.toMatchObject({
      ok: false,
      reason: 'failed',
    });
  });
});
