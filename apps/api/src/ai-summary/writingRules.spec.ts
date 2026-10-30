import { prepare } from './articlePrep';
import { selectPrompt, writerPrompt } from './newsletterWriter.service';
import { GENDER_RULES } from './writingRules';
import { editorPrompt } from '../edition/editor';

const articles = prepare([{ title: '제목', content: '본문', source: 'KBS' }]);

describe('성차별 · 여성혐오 원칙', () => {
  it('고르기: 여성을 대상화 · 비하하는 기사는 빼고, 차별을 문제로 다룬 보도는 남긴다', () => {
    const prompt = selectPrompt([{ articles }], '사회');
    expect(prompt).toContain(
      '여성을 깎아내리거나 대상화하는 것이 기사의 중심인 소식',
    );
    expect(prompt).toContain('성차별 · 여성혐오 자체를 문제로 다루는 보도');
  });

  it('쓰기: 차별 내용은 싣지 않고, 다뤄야 하면 비판적으로 · 엇갈린 주장에도 같은 원칙', () => {
    const prompt = writerPrompt(articles, '사회');
    for (const rule of GENDER_RULES) expect(prompt).toContain(rule);
    expect(prompt).toContain(
      '차별 · 혐오 주장은 대등한 한쪽 주장으로 싣지 않습니다',
    );
  });

  it('메일 편집(한 줄 · 흐름)에도 같은 원칙', () => {
    const prompt = editorPrompt([]);
    for (const rule of GENDER_RULES) expect(prompt).toContain(rule);
  });
});
