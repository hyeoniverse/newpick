import { AiService, AiUnavailable, FALLBACK_DAILY_USD } from './ai.service';
import { OpenModelService, OpenModelUnavailable } from './open-model.service';

const openOk = (text: string) => ({
  text,
  tokens: 30,
  usage: { model: '@cf/google/gemma-4-26b-a4b-it', input: 20, output: 10 },
  neurons: 1,
});
const claudeOk = (text: string, model = 'claude-haiku-5-5', input = 1000) => ({
  text,
  tokens: input + 100,
  usage: { model, input, output: 100 },
});

const setup = () => {
  const open = { generate: jest.fn(), embed: jest.fn() };
  const claude = { generate: jest.fn() };
  const service = new AiService(open as never, claude as never);
  return { open, claude, service };
};

const ask = { stage: 'scrap-analysis', system: 's', prompt: 'p' } as const;

describe('AiService 공급자 고르기', () => {
  it('prefer: claude는 처음부터 Claude (뉴스레터 본문처럼 품질이 중요한 일)', async () => {
    const { open, claude, service } = setup();
    claude.generate.mockResolvedValue(claudeOk('ok', 'claude-sonnet-5-5'));
    const result = await service.generate({ ...ask, prefer: 'claude' });
    expect(result.provider).toBe('claude');
    expect(open.generate).not.toHaveBeenCalled();
    expect(claude.generate.mock.calls[0][0]).not.toHaveProperty('model');
  });

  it('prefer: open은 오픈 모델 결과를 쓰고 사용량에 stage를 붙인다', async () => {
    const { open, claude, service } = setup();
    open.generate.mockResolvedValue(openOk('{"a":1}'));
    const result = await service.generate({
      ...ask,
      prefer: 'open',
      schema: { type: 'object' },
    });
    expect(result).toMatchObject({
      provider: 'open',
      usage: { stage: 'scrap-analysis' },
    });
    expect(claude.generate).not.toHaveBeenCalled();
  });

  it.each([
    ['할당 초과 · 장애', () => Promise.reject(new OpenModelUnavailable('429'))],
    ['JSON 형식을 깸', () => Promise.resolve(openOk('not json'))],
  ])('오픈 모델이 안 되면(%s) Claude 빠른 모델로 넘긴다', async (_, fail) => {
    const { open, claude, service } = setup();
    open.generate.mockImplementation(fail);
    claude.generate.mockResolvedValue(claudeOk('{"a":1}'));
    const result = await service.generate({
      ...ask,
      prefer: 'open',
      schema: { type: 'object' },
    });
    expect(result.provider).toBe('claude');
    expect(claude.generate.mock.calls[0][0].model).toBe('claude-haiku-5-5');
  });

  it('내용 검사(accept)를 통과하지 못해도 Claude로 넘긴다', async () => {
    const { open, claude, service } = setup();
    open.generate.mockResolvedValue(openOk('너무 짧음'));
    claude.generate.mockResolvedValue(claudeOk('충분히 긴 결과'));
    const result = await service.generate({
      ...ask,
      prefer: 'open',
      accept: (text) => text.length > 5,
    });
    expect(result.text).toBe('충분히 긴 결과');
  });

  it('fallback: false면 넘기지 않고 AiUnavailable (밤 배치는 미룬다)', async () => {
    const { open, claude, service } = setup();
    open.generate.mockRejectedValue(new OpenModelUnavailable('429'));
    await expect(
      service.generate({ ...ask, prefer: 'open', fallback: false }),
    ).rejects.toBeInstanceOf(AiUnavailable);
    expect(claude.generate).not.toHaveBeenCalled();
  });

  it(`Claude로 넘긴 비용이 오늘 상한($${FALLBACK_DAILY_USD})에 닿으면 더 넘기지 않는다`, async () => {
    const { open, claude, service } = setup();
    open.generate.mockRejectedValue(new OpenModelUnavailable('429'));
    // Haiku 5.5 입력 100만 토큰 = $0.1 → 한 번에 상한
    claude.generate.mockResolvedValue(
      claudeOk('ok', 'claude-haiku-5-5', 1_000_000),
    );

    await service.generate({ ...ask, prefer: 'open' });
    await expect(
      service.generate({ ...ask, prefer: 'open' }),
    ).rejects.toBeInstanceOf(AiUnavailable);
    expect(claude.generate).toHaveBeenCalledTimes(1);
  });

  it('임베딩은 넘길 곳이 없어 안 되면 AiUnavailable', async () => {
    const { open, service } = setup();
    open.embed.mockResolvedValueOnce([[0.1, 0.2]]);
    expect(await service.embed(['a'])).toEqual([[0.1, 0.2]]);
    open.embed.mockRejectedValueOnce(new OpenModelUnavailable('429'));
    await expect(service.embed(['a'])).rejects.toBeInstanceOf(AiUnavailable);
  });
});

describe('OpenModelService (Workers AI)', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
    jest.restoreAllMocks();
  });
  const configure = () => {
    process.env.CF_ACCOUNT_ID = 'acc';
    process.env.CF_AI_TOKEN = 'tok';
  };
  const reply = (status: number, body: unknown) =>
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(body), { status }) as never,
      );

  it('설정이 없으면 부르지 않고 OpenModelUnavailable', async () => {
    delete process.env.CF_ACCOUNT_ID;
    const fetch = jest.spyOn(global, 'fetch');
    await expect(
      new OpenModelService().generate({ system: 's', prompt: 'p' }),
    ).rejects.toBeInstanceOf(OpenModelUnavailable);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('하루 할당 초과(429) · 서버 오류는 OpenModelUnavailable, 잘린 응답은 오류', async () => {
    configure();
    reply(429, {});
    await expect(
      new OpenModelService().generate({ system: 's', prompt: 'p' }),
    ).rejects.toBeInstanceOf(OpenModelUnavailable);

    reply(200, {
      choices: [{ message: { content: '{"a"' }, finish_reason: 'length' }],
    });
    await expect(
      new OpenModelService().generate({ system: 's', prompt: 'p' }),
    ).rejects.toThrow('잘렸습니다');
  });

  it('생각 단계를 끄고, 스키마를 주면 json_schema로 요청한다', async () => {
    configure();
    const fetch = reply(200, {
      choices: [{ message: { content: '{"a":1}' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5, neurons: 0.4 },
    });
    const result = await new OpenModelService().generate({
      system: 's',
      prompt: 'p',
      schema: { type: 'object' },
    });
    const body = JSON.parse(fetch.mock.calls[0][1]!.body as string);
    expect(body.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(body.response_format.type).toBe('json_schema');
    expect(result).toMatchObject({ text: '{"a":1}', tokens: 15, neurons: 0.4 });
  });

  it('임베딩은 입력과 같은 개수 · 순서', async () => {
    configure();
    reply(200, { data: [{ embedding: [1] }, { embedding: [2] }] });
    expect(await new OpenModelService().embed(['a', 'b'])).toEqual([[1], [2]]);
    reply(200, { data: [{ embedding: [1] }] });
    await expect(new OpenModelService().embed(['a', 'b'])).rejects.toThrow(
      '개수',
    );
    expect(await new OpenModelService().embed([])).toEqual([]);
  });
});
