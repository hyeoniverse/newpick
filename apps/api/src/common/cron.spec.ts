import {
  CRAWL_EVERY_HOURS,
  EVERY_DAY,
  crawlCron,
  dailyCron,
  mailCron,
} from './cron';

describe('cron 식', () => {
  it('매일 hour:minute', () => {
    expect(dailyCron({ hour: 8, minute: 30 })).toBe('0 30 8 * * *');
    expect(dailyCron({ hour: 4, minute: 30 })).toBe('0 30 4 * * *');
  });

  it('수집은 CRAWL_EVERY_HOURS마다 (지금 1시간: 하루 24번), 시는 오름차순 · 분은 그대로', () => {
    const hours = Array.from(
      { length: 24 / CRAWL_EVERY_HOURS },
      (_, i) => i * CRAWL_EVERY_HOURS,
    ).join(',');
    expect(crawlCron({ hour: 8, minute: 0 })).toBe(`0 0 ${hours} * * *`);
    expect(crawlCron({ hour: 0, minute: 30 })).toBe(`0 30 ${hours} * * *`);
  });

  it('CRAWL_EVERY_HOURS가 1이면 0~23시 모두', () => {
    expect(CRAWL_EVERY_HOURS).toBe(1);
    expect(
      crawlCron({ hour: 8, minute: 0 }).split(' ')[2].split(','),
    ).toHaveLength(24);
  });

  it('메일: 매일이면 요일 *, 아니면 그 요일 · 분 기본 40', () => {
    expect(mailCron(8, EVERY_DAY)).toBe('0 40 8 * * *');
    expect(mailCron(9, 1)).toBe('0 40 9 * * 1');
    expect(mailCron(9, 0, 5)).toBe('0 5 9 * * 0');
  });
});
