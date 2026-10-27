import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { toBooleanQuery } from './search-terms';
import { NewsletterSearchDto } from '../controllers/newsletter.dto';

const validate = (query: Record<string, unknown>) =>
  validateSync(
    plainToInstance(NewsletterSearchDto, query, {
      enableImplicitConversion: true,
    }),
  ).map((error) => error.property);

describe('toBooleanQuery (#20)', () => {
  it('띄어쓴 낱말마다 반드시(+) · 따옴표로 묶는다', () => {
    expect(toBooleanQuery('더존 침해사고')).toBe('+"더존" +"침해사고"');
  });

  it('불린 모드 연산자는 지워 사용자가 식을 바꾸지 못하게 한다', () => {
    expect(toBooleanQuery('코스피* -"하락" (환율)')).toBe(
      '+"코스피" +"하락" +"환율"',
    );
  });

  it('ngram(2글자)보다 짧은 낱말은 빼고, 남는 게 없으면 null', () => {
    expect(toBooleanQuery('a 코스피')).toBe('+"코스피"');
    expect(toBooleanQuery('a b')).toBeNull();
  });

  it('낱말은 8개까지만', () => {
    const q = Array.from({ length: 12 }, (_, i) => `낱말${i}`).join(' ');
    expect(toBooleanQuery(q)?.split(' ')).toHaveLength(8);
  });
});

describe('NewsletterSearchDto (#20)', () => {
  it('조건이 없어도 된다 (전체 목록)', () => {
    expect(validate({})).toEqual([]);
  });

  it('모든 조건을 받는다', () => {
    expect(
      validate({
        q: '침해사고',
        keyword: '코스피',
        categoryId: '3',
        from: '2026-10-01',
        to: '2026-10-27',
        sort: 'popular',
        limit: '20',
        offset: '40',
      }),
    ).toEqual([]);
  });

  it('검색어 2글자 미만 · 날짜 형식 · 정렬 값 · limit 상한을 거절한다', () => {
    expect(validate({ q: ' a ' })).toEqual(['q']);
    expect(validate({ from: '2026/10/01' })).toEqual(['from']);
    expect(validate({ sort: 'relevance' })).toEqual(['sort']);
    expect(validate({ limit: '100' })).toEqual(['limit']);
  });
});
