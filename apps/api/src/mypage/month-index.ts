import { KST } from 'src/common/kst';

/** 받은 달 (한국 시각 'YYYY-MM') */
const kstMonth = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: KST }).format(date).slice(0, 7);

/**
 * 보낸 시각들을 정렬 순서대로 달로 묶어 달마다 통수와 그 달 첫 메일의 순번(0부터)을 준다.
 * 마이페이지 '내 뉴스레터'의 달 막대에서 그 달로 바로 가기(쪽 = 순번 / 한 쪽 수)에 쓴다
 */
export function monthIndex(sentAts: Date[], order: 'desc' | 'asc') {
  const sorted = [...sentAts].sort((a, b) =>
    order === 'asc' ? a.getTime() - b.getTime() : b.getTime() - a.getTime(),
  );
  const months: { month: string; count: number; firstIndex: number }[] = [];
  sorted.forEach((sentAt, i) => {
    const month = kstMonth(sentAt);
    const last = months[months.length - 1];
    if (last?.month === month) last.count += 1;
    else months.push({ month, count: 1, firstIndex: i });
  });
  return months;
}
