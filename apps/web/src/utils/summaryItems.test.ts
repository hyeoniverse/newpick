import { describe, expect, it } from 'vitest';
import { summaryItems } from '@/utils/summaryItems';

describe('AI 요약을 소식별 목록으로', () => {
	it('문장마다 한 항목 (소수점 · 날짜 숫자에서는 나누지 않는다)', () => {
		expect(
			summaryItems(
				'김민석 민주당 대표가 3일 사과했지만 친청계가 4일 공개 사과를 요구했다. 이재명 대통령은 "가짜뉴스다."라고 반박했다. 룰라가 51.76%를 얻어 4선에 성공했다.',
			),
		).toEqual([
			'김민석 민주당 대표가 3일 사과했지만 친청계가 4일 공개 사과를 요구했다.',
			'이재명 대통령은 "가짜뉴스다."라고 반박했다.',
			'룰라가 51.76%를 얻어 4선에 성공했다.',
		]);
	});

	it('줄바꿈(문단)도 나누고, 빈 줄은 버린다', () => {
		expect(summaryItems('첫 소식이다.\n\n둘째 소식이다.')).toEqual(['첫 소식이다.', '둘째 소식이다.']);
		expect(summaryItems('한 문장뿐이다.')).toEqual(['한 문장뿐이다.']);
		expect(summaryItems('')).toEqual([]);
	});
});
