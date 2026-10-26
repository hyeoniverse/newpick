import { Logger } from '@nestjs/common';
import { Newsletter } from '@prisma/client';
import {
  BasicSummarizeService,
  SUMMARY_LENGTH,
  summaryPrompt,
} from './basicSummarize.service';
import {
  clean,
  CreateTitleService,
  HEADLINE_LENGTH,
  headlinePrompt,
} from './createTitle.service';
import { AiSummaryService } from './ai-summary.service';
import { newsletterTemplate } from '../mail/htmlTemplate';

const claudeReturning = (text: string) => ({
  generate: jest.fn().mockResolvedValue({ text, tokens: 42 }),
});
const prisma = () => ({
  aiProcessLog: { create: jest.fn() },
  newsCategory: { findUnique: jest.fn().mockResolvedValue({ name: 'IT' }) },
});

describe('요약 분량 (#41)', () => {
  it('단어 수 대신 소식 수·문장 수·글자 수로 분량을 정한다', () => {
    const prompt = summaryPrompt('기사 원문');
    expect(prompt).not.toMatch(/words/);
    expect(prompt).toContain('3~5개');
    expect(prompt).toContain('2~3문장');
    expect(prompt).toContain(`${SUMMARY_LENGTH.min}~${SUMMARY_LENGTH.max}자`);
    expect(prompt).toContain('마크다운');
    expect(prompt.endsWith('기사 원문')).toBe(true);
  });

  it('요약 호출은 effort medium, 분량에 맞춘 max_tokens로 보낸다', async () => {
    const claude = claudeReturning('요약');
    await new BasicSummarizeService(claude as never).basicSummarize('원문');

    expect(claude.generate).toHaveBeenCalledWith(
      expect.objectContaining({ effort: 'medium', maxTokens: 8000 }),
    );
  });
});

describe('제목과 부제목 (#42)', () => {
  it('나열·날짜·"주요 소식"을 금지하고 길이를 지시한다', () => {
    const prompt = headlinePrompt('본문');
    expect(prompt).toContain(`${HEADLINE_LENGTH.title}자 이내`);
    expect(prompt).toContain(`${HEADLINE_LENGTH.subtitle}자 이내`);
    expect(prompt).toContain('나열하지 않습니다');
    expect(prompt).toContain('주요 소식');
  });

  it('분야를 알려 주면 그 분야 소식을 우선하라고 한다', () => {
    expect(headlinePrompt('본문', 'IT')).toContain('IT 분야에 가까운 소식');
    expect(summaryPrompt('원문', 'IT')).toContain('IT 분야에 가까운 소식');
  });

  it('제목 전체를 감싼 따옴표만 걷어 내고, 제목 안의 인용은 그대로 둔다', () => {
    expect(clean(' “우주쓰레기 잡는 위성” ')).toBe('우주쓰레기 잡는 위성');
    // 실제 응답: 끝의 닫는 따옴표까지 지워 "아니다로 끝나던 버그
    expect(clean('이 대통령 "농지 전수조사, 땅 뺏는 것 아니다"')).toBe(
      '이 대통령 "농지 전수조사, 땅 뺏는 것 아니다"',
    );
    expect(clean('"A" 그리고 "B"')).toBe('"A" 그리고 "B"');
  });

  it('한 번의 호출에서 JSON 스키마로 받아 감싼 따옴표를 걷어 낸다', async () => {
    const claude = claudeReturning(
      JSON.stringify({
        title: '“우주쓰레기 잡는 위성, 내년 누리호로 발사”',
        subtitle: ' PHP 취약점 비상, 코스피 5500선 붕괴 ',
      }),
    );
    const log = prisma();
    const service = new CreateTitleService(
      claude as never,
      log as never,
      new Logger(),
    );

    await expect(service.createHeadline('본문')).resolves.toEqual({
      title: '우주쓰레기 잡는 위성, 내년 누리호로 발사',
      subtitle: 'PHP 취약점 비상, 코스피 5500선 붕괴',
    });
    expect(claude.generate).toHaveBeenCalledTimes(1);
    const [{ schema }] = claude.generate.mock.calls[0];
    expect(schema.required).toEqual(['title', 'subtitle']);
    expect(log.aiProcessLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processType: 'title', token: 42 }),
      }),
    );
  });

  it('제목이 비면 실패로 처리한다 (빈 제목으로 저장하지 않게)', async () => {
    const service = new CreateTitleService(
      claudeReturning(
        JSON.stringify({ title: ' ', subtitle: '부제' }),
      ) as never,
      prisma() as never,
      new Logger(),
    );
    await expect(service.createHeadline('본문')).rejects.toThrow('빈 제목');
  });

  it('요약 → 제목·부제목 → 저장까지 분야 이름과 부제목을 넘긴다', async () => {
    const createNewsletter = jest.fn().mockResolvedValue({ id: 1 });
    const createHeadline = jest
      .fn()
      .mockResolvedValue({ title: '제목', subtitle: '부제목' });
    const basicSummarize = jest
      .fn()
      .mockResolvedValue({ text: '요약', tokens: 1 });
    const service = new AiSummaryService(
      prisma() as never,
      {} as never,
      { createNewsletter } as never,
      { createHeadline } as never,
      { formatHtml: jest.fn().mockResolvedValue('<div></div>') } as never,
      { basicSummarize } as never,
    );

    await service.summarizeText(
      [{ title: 't', content: 'c', link: 'l', images: [] }] as never,
      1,
      false,
    );

    // IT 뉴스레터가 증시 기사로 제목을 짓지 않게 분야를 알려 준다
    expect(basicSummarize).toHaveBeenCalledWith(expect.any(String), 'IT');
    expect(createHeadline).toHaveBeenCalledWith('요약', 'IT');
    expect(createNewsletter).toHaveBeenCalledWith(
      '제목',
      '부제목',
      '요약',
      'l',
      1,
      '<div></div>',
      '',
    );
  });
});

describe('구독 메일 카드', () => {
  const base = {
    id: 1,
    title: '제목',
    content: '가'.repeat(150),
    imageUrl: null,
    viewcount: 0,
    createdAt: new Date('2026-10-27'),
  };

  it('부제목이 있으면 본문 앞부분 대신 부제목을 보여 준다', () => {
    const html = newsletterTemplate({
      ...base,
      subtitle: '부제목 한 줄',
    } as Newsletter);
    expect(html).toContain('부제목 한 줄');
    expect(html).not.toContain('가'.repeat(100));
  });

  it('부제목이 없는 이전 뉴스레터는 본문 앞 100자', () => {
    const html = newsletterTemplate({ ...base, subtitle: null } as Newsletter);
    expect(html).toContain('가'.repeat(100) + '...');
  });
});
