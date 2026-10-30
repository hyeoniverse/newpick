/**
 * #119 1단계: 오픈 모델이 Claude 대신 뉴스레터를 쓸 수 있는지 비교 (Claude는 새로 부르지 않음).
 * 이미 Claude가 쓴 뉴스레터(newsletters)의 원문(usedNews → Mongo CrawledNews)을 그대로 오픈 모델(Ollama)에 넣고,
 * 같은 쓰기 프롬프트 · JSON 형식으로 쓰게 한 뒤 Claude 결과와 나란히 비교한다.
 *
 *   npx ts-node scripts/compare-open-models.ts --ids 58,59 --models qwen3.5:9b-q4_K_M,gemma4:12b-it-q4_K_M --out ./compare
 *   npx ts-node scripts/compare-open-models.ts --ids 58,59 --models cf:@cf/google/gemma-4-26b-a4b-it --out ./compare
 *
 * 모델 이름이 cf:로 시작하면 Cloudflare Workers AI(CF_ACCOUNT_ID · CF_AI_TOKEN), 아니면 Ollama.
 *
 * 나오는 것: <out>/index.html (편마다 Claude · 모델별 본문을 나란히), <out>/results.json (지표)
 * 지표: JSON 형식 지킴 · 걸린 시간 · 출력 토큰/초 · 원문에 없는 수치(지어냈을 수 있는 수치) 개수
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import { prepare } from '../src/ai-summary/articlePrep';
import {
  normalize,
  WRITER_SCHEMA,
  WRITER_SYSTEM,
  writerPrompt,
  type WrittenNewsletter,
} from '../src/ai-summary/newsletterWriter.service';
import { renderNewsletterHtml } from '../src/ai-summary/newsletterHtml';

const OLLAMA = process.env.OLLAMA_URL || 'http://localhost:11434';

const arg = (name: string, fallback = '') => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};

type Article = { title: string; content: string; source: string; link: string };

/** 글에서 수치만 뽑는다 (1,234 · 5.6% · 7월 같은 숫자 덩어리) */
const numbers = (text: string) =>
  new Set(
    (text.match(/\d[\d,.]*/g) ?? []).map((n) =>
      n.replace(/[,.]$/, '').replace(/,/g, ''),
    ),
  );

/** 원문에 없는 수치: 지어냈거나 계산했을 수 있는 것 */
const unknownNumbers = (written: string, source: string) => {
  const known = numbers(source);
  // 소식 번호(01 · 02)는 화면이 붙이는 것이라 뺀다
  return [...numbers(written)].filter(
    (n) => !known.has(n) && n.length > 1 && !/^0\d$/.test(n),
  );
};

const plainText = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/** 한 번 쓰기의 응답: 본문(JSON 글) · 토큰 · 오류. 공급자마다 이 모양으로 맞춘다 */
type Reply = {
  content?: string;
  inputTokens: number;
  outputTokens: number;
  tokensPerSec?: number;
  neurons?: number;
  error?: string;
};

async function askOllama(
  model: string,
  system: string,
  prompt: string,
): Promise<Reply> {
  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      format: WRITER_SCHEMA,
      options: { temperature: 0.3, num_ctx: 32768 },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = (await res.json()) as {
    message?: { content: string };
    eval_count?: number;
    eval_duration?: number;
    prompt_eval_count?: number;
    error?: string;
  };
  return {
    content: data.message?.content,
    inputTokens: data.prompt_eval_count ?? 0,
    outputTokens: data.eval_count ?? 0,
    tokensPerSec: data.eval_duration
      ? +((data.eval_count ?? 0) / (data.eval_duration / 1e9)).toFixed(1)
      : 0,
    error: data.message ? undefined : (data.error ?? 'no message'),
  };
}

/** Cloudflare Workers AI (OpenAI 호환 경로). 생각(reasoning)은 끄고, 쓴 neurons를 함께 받는다 */
async function askWorkersAi(
  model: string,
  system: string,
  prompt: string,
): Promise<Reply> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/v1/chat/completions`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.CF_AI_TOKEN}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 12000,
        chat_template_kwargs: { enable_thinking: false },
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'newsletter', schema: WRITER_SCHEMA },
        },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    },
  );
  const data = (await res.json()) as {
    choices?: { message: { content: string | null } }[];
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      neurons?: number;
    };
    errors?: { message: string }[];
  };
  const content = data.choices?.[0]?.message.content ?? undefined;
  return {
    content,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    neurons: data.usage?.neurons ? Math.round(data.usage.neurons) : undefined,
    error: content
      ? undefined
      : (data.errors?.map((e) => e.message).join(', ') ??
        `HTTP ${res.status}, 본문 없음`),
  };
}

async function writeWith(model: string, articles: Article[], category: string) {
  const prepped = prepare(articles);
  const started = Date.now();
  const prompt = writerPrompt(prepped, category);
  const reply = model.startsWith('cf:')
    ? await askWorkersAi(model.slice(3), WRITER_SYSTEM, prompt)
    : await askOllama(model, WRITER_SYSTEM, prompt);
  const seconds = Math.round((Date.now() - started) / 1000);
  const { content, error, ...stats } = reply;
  const tokensPerSec =
    stats.tokensPerSec ||
    (seconds ? +(stats.outputTokens / seconds).toFixed(1) : 0);
  if (!content)
    return { ...stats, seconds, tokensPerSec, ok: false as const, error };
  try {
    const newsletter = normalize(
      JSON.parse(content) as WrittenNewsletter,
      (n) => (prepped[n - 1] ? prepped[n - 1].index + 1 : undefined),
    );
    return { ...stats, seconds, tokensPerSec, ok: true as const, newsletter };
  } catch (e) {
    return {
      ...stats,
      seconds,
      tokensPerSec,
      ok: false as const,
      error: `형식 깨짐: ${(e as Error).message}`,
    };
  }
}

async function main() {
  const ids = arg('ids').split(',').filter(Boolean).map(Number);
  const models = arg('models', 'qwen3.5:9b').split(',');
  const out = arg('out', './compare');
  mkdirSync(out, { recursive: true });

  const prisma = new PrismaClient();
  await mongoose.connect(process.env.MONGO_URL as string);
  const crawled = mongoose.connection.collection('CrawledNews');

  const results: Record<string, unknown>[] = [];
  const sections: string[] = [];
  for (const id of ids) {
    const claude = await prisma.newsletter.findUniqueOrThrow({
      where: { id },
      include: { category: true },
    });
    const links = claude.usedNews.split(',').filter(Boolean);
    const articles = (await crawled
      .find({ link: { $in: links } })
      .toArray()) as unknown as Article[];
    if (!articles.length) {
      console.log(
        `#${id}: 원문이 Mongo에 없음 (30일이 지나 지워졌을 수 있음), 건너뜀`,
      );
      continue;
    }
    const source = articles.map((a) => `${a.title} ${a.content}`).join(' ');
    const claudeText = plainText(claude.contentAsHTML);
    const columns = [
      {
        name: 'Claude (저장된 것)',
        html: claude.contentAsHTML,
        meta: `원문에 없는 수치 ${unknownNumbers(claudeText, source).length}개`,
      },
    ];
    const row: Record<string, unknown> = {
      id,
      category: claude.category.name,
      articles: articles.length,
      claude: { unknownNumbers: unknownNumbers(claudeText, source) },
    };

    for (const model of models) {
      console.log(
        `#${id} ${claude.category.name} · ${model} 쓰는 중 (기사 ${articles.length}건)`,
      );
      const r = await writeWith(model, articles, claude.category.name);
      if (!('newsletter' in r)) {
        row[model] = { ok: false, error: r.error, seconds: r.seconds };
        columns.push({
          name: model,
          html: `<pre>${r.error}</pre>`,
          meta: `실패 · ${r.seconds}초`,
        });
        continue;
      }
      const html = renderNewsletterHtml(r.newsletter, articles);
      const unknown = unknownNumbers(
        plainText(html) + ' ' + r.newsletter.title,
        source,
      );
      row[model] = {
        ok: true,
        seconds: r.seconds,
        tokensPerSec: r.tokensPerSec,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        neurons: r.neurons,
        stories: r.newsletter.stories.length,
        unknownNumbers: unknown,
      };
      columns.push({
        name: model,
        html: `<h2>${r.newsletter.title}</h2><p><i>${r.newsletter.subtitle ?? ''}</i></p>${html}`,
        meta: `${r.seconds}초 · ${r.tokensPerSec} 토큰/초${r.neurons ? ` · ${r.neurons} neurons` : ''} · 소식 ${r.newsletter.stories.length}개 · 원문에 없는 수치 ${unknown.length}개${unknown.length ? ` (${unknown.slice(0, 8).join(', ')})` : ''}`,
      });
      console.log(`  → ${r.seconds}초, 원문에 없는 수치 ${unknown.length}개`);
    }
    results.push(row);
    sections.push(
      `<section><h1>#${id} ${claude.category.name} · ${claude.title}</h1><div class="cols">${columns
        .map(
          (c) =>
            `<div class="col"><h3>${c.name}</h3><p class="meta">${c.meta}</p>${c.html}</div>`,
        )
        .join('')}</div></section>`,
    );
  }

  writeFileSync(join(out, 'results.json'), JSON.stringify(results, null, 2));
  writeFileSync(
    join(out, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>오픈 모델 비교</title><style>
body{font-family:Pretendard,system-ui,sans-serif;margin:24px;color:#111}
section{margin-bottom:48px}h1{font-size:20px}.cols{display:grid;grid-template-columns:repeat(${models.length + 1},minmax(0,1fr));gap:16px}
.col{border:1px solid #d9d9d9;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;overflow:hidden}
.col img{max-width:100%}.meta{color:#3610e1;font-weight:600}</style>${sections.join('')}`,
  );
  console.log(`\n${join(out, 'index.html')}`);
  await mongoose.disconnect();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
