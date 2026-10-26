import Anthropic from '@anthropic-ai/sdk';
import { ClaudeService } from './claude.service';

function reply(overrides: Record<string, unknown> = {}) {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5-5',
    content: [{ type: 'text', text: '  요약 결과  ' }],
    stop_reason: 'end_turn',
    stop_details: null,
    usage: { input_tokens: 100, output_tokens: 20 },
    ...overrides,
  };
}

/** 실제 HTTP 대신 요청을 기록하고 정해 둔 응답을 돌려주는 클라이언트 */
function setup(body: Record<string, unknown>) {
  const requests: { headers: Headers; body: any }[] = [];
  const fetch = jest.fn(async (_url: string, init: RequestInit) => {
    requests.push({
      headers: new Headers(init.headers),
      body: JSON.parse(init.body as string),
    });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  const client = new Anthropic({ apiKey: 'test', fetch, maxRetries: 0 });
  return { service: new ClaudeService(client), requests };
}

describe('ClaudeService.generate', () => {
  it('텍스트와 사용 토큰을 돌려주고, 거절 시 대체 모델을 쓰도록 요청한다', async () => {
    const { service, requests } = setup(reply());

    const result = await service.generate({ system: 'sys', prompt: '본문' });

    expect(result).toEqual({
      text: '요약 결과',
      tokens: 120,
      usage: { model: 'claude-sonnet-5-5', input: 100, output: 20 },
    });
    const [{ headers, body }] = requests;
    expect(headers.get('anthropic-beta')).toContain(
      'server-side-fallback-2026-07-01',
    );
    expect(body).toMatchObject({
      model: 'claude-sonnet-5-5',
      fallbacks: 'default',
      system: 'sys',
      messages: [{ role: 'user', content: '본문' }],
      output_config: { effort: 'low' },
    });
    expect(body).not.toHaveProperty('temperature');
  });

  // Haiku 5.5는 fallbacks를 보내면 400 (서버 측 대체 모델 없음)
  it('Haiku에는 대체 모델 옵션과 그 beta 헤더를 보내지 않는다', async () => {
    const { service, requests } = setup(reply({ model: 'claude-haiku-5-5' }));

    const result = await service.generate({
      model: 'claude-haiku-5-5',
      system: 'sys',
      prompt: '본문',
    });

    const [{ headers, body }] = requests;
    expect(body.model).toBe('claude-haiku-5-5');
    expect(body).not.toHaveProperty('fallbacks');
    expect(headers.get('anthropic-beta') ?? '').not.toContain(
      'server-side-fallback',
    );
    expect(result.usage.model).toBe('claude-haiku-5-5');
  });

  it('schema를 넘기면 JSON 스키마 출력 형식을 요청한다', async () => {
    const { service, requests } = setup(
      reply({ content: [{ type: 'text', text: '{"category":"IT"}' }] }),
    );
    const schema = { type: 'object', properties: {} };

    await service.generate({ system: 's', prompt: 'p', schema });

    expect(requests[0].body.output_config.format).toEqual({
      type: 'json_schema',
      schema,
    });
  });

  it('거절되면 오류를 던진다', async () => {
    const { service } = setup(
      reply({
        content: [],
        stop_reason: 'refusal',
        stop_details: { type: 'refusal', category: 'cyber', explanation: '' },
      }),
    );

    await expect(
      service.generate({ system: 's', prompt: 'p' }),
    ).rejects.toThrow('cyber');
  });

  it('max_tokens에서 잘리면 오류를 던진다 (잘린 요약 저장 방지)', async () => {
    const { service } = setup(reply({ stop_reason: 'max_tokens' }));

    await expect(
      service.generate({ system: 's', prompt: 'p' }),
    ).rejects.toThrow('max_tokens');
  });
});
