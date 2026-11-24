import { PIPELINE_LIMITS, clusterLabel, keywordsOf, wordsOf } from './pipeline';
import { PipelineLiveService } from './pipeline-live.service';

describe('과정 보기: 키워드 · 묶음 이름 (AI 호출 없음)', () => {
	it('낱말: 말머리 · 조사 · 상투어 · 숫자로 시작하는 말 · 서술(~다)은 빼고, 한 제목 안에서는 한 번', () => {
		expect(wordsOf('[속보] 대통령이 비상계엄을 선포…국회는 "해제 요구" (종합) 3000명 온다', new Set(['국회']))).toEqual(
			['대통령', '비상계엄', '선포', '국회', '해제', '요구'],
		);
		expect(wordsOf('코스피 코스피 급락')).toEqual(['코스피', '급락']);
	});

	it("한 글자 조사는 조심해서 뗀다: '어린이' · '올가을'은 그대로, 다른 제목에 따로 나온 말이면 뗀다", () => {
		expect(wordsOf('어린이 올가을 축제')).toEqual(['어린이', '올가을', '축제']);
		expect(wordsOf('선포를 미뤄', new Set(['선포']))).toEqual(['선포', '미뤄']);
		expect(wordsOf('선포를 미뤄')).toEqual(['선포를', '미뤄']);
	});

	it(`키워드: ${PIPELINE_LIMITS.minKeyword}개 이상 제목에 나온 것만, 많은 것부터 · 같으면 가나다순`, () => {
		const titles = ['코스피 급락 마감', '코스피 2% 급락', '환율 급등에 코스피', '야구 결과'];
		expect(keywordsOf(titles)).toEqual([
			{ word: '코스피', count: 3 },
			{ word: '급락', count: 2 },
		]);
	});

	it('묶음 이름: 묶음 안 제목에 함께 나온 낱말 둘 (기사 제목을 그대로 쓰지 않음)', () => {
		expect(clusterLabel(['비상계엄 선포 국회', '국회 비상계엄 해제 요구', '비상계엄 해제'])).toBe('비상계엄 · 국회');
		expect(clusterLabel(['[단독] 신작 인터뷰 공개'])).toBe('신작 · 인터뷰');
	});
});

describe('PipelineLiveService', () => {
	const setup = (rows: unknown[] = []) => {
		const prisma = {
			pipelineSnapshot: {
				upsert: jest.fn().mockResolvedValue({}),
				findMany: jest.fn().mockResolvedValue(rows),
			},
		};
		const ai = { embed: jest.fn() };
		return { prisma, ai, service: new PipelineLiveService(prisma as never, ai as never) };
	};

	it('도는 동안 단계 · 분야를 바꾸고, 끝나면 기다리던 단계는 건너뜀 · 도는 단계는 끝냄으로 바꿔 DB에 남긴다', async () => {
		const { service, prisma } = setup();
		service.begin('crawl');
		service.step('crawl', 'fetch', { state: 'done', count: 12, progress: [6, 6] });
		service.step('crawl', 'classify', { state: 'running' });
		let live = await service.live();
		expect(live.crawl?.status).toBe('running');
		expect(live.crawl?.steps.map((s) => s.state)).toEqual(['done', 'running', 'waiting', 'waiting']);
		await service.finish('crawl', 'done');
		live = await service.live();
		expect(live.crawl?.steps.map((s) => s.state)).toEqual(['done', 'done', 'skipped', 'skipped']);
		expect(prisma.pipelineSnapshot.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { kind: 'crawl' } }));
		// 끝난 뒤에는 바꾸지 않는다
		service.step('crawl', 'fetch', { count: 99 });
		expect((await service.live()).crawl?.steps[0].count).toBe(12);
	});

	it('수집한 기사로 분야별 건수 · 키워드 · 같은 사건 묶음(2건 이상)을 채운다. 임베딩을 못 하면 제목으로만', async () => {
		const { service, ai } = setup();
		ai.embed.mockRejectedValue(new Error('down'));
		service.begin('crawl');
		await service.describe('crawl', [
			{ title: '대통령 비상계엄 선포', category: ['정치'] },
			{ title: '대통령 비상계엄 선포 국회 반발', category: ['정치'] },
			{ title: '코스피 급락 마감', category: ['경제'] },
		]);
		const run = (await service.live()).crawl!;
		expect(run.categories).toEqual([
			{ name: '정치', count: 2 },
			{ name: '경제', count: 1 },
		]);
		expect(run.keywords.map((k) => k.word)).toEqual(['대통령', '비상계엄', '선포']);
		expect(run.clusters).toEqual([{ label: '대통령 · 비상계엄', size: 2 }]);
		expect(run.steps.find((s) => s.key === 'cluster')?.count).toBe(1);
		// 기사 제목은 내보내지 않는다
		expect(JSON.stringify(run)).not.toContain('국회 반발');
	});

	it('서버를 켠 뒤 처음 물으면 남겨 둔 마지막 결과를 읽는다 (도는 것이 있으면 그것이 먼저)', async () => {
		const saved = { kind: 'summary', data: { kind: 'summary', status: 'done', steps: [] } };
		const { service, prisma } = setup([saved]);
		service.setNextTimes(() => ({ crawl: '2026-11-24T05:00:00.000Z', summary: null }));
		const live = await service.live();
		expect(live.summary?.status).toBe('done');
		expect(live.crawl).toBeNull();
		expect(live.next.crawl).toBe('2026-11-24T05:00:00.000Z');
		await service.live();
		expect(prisma.pipelineSnapshot.findMany).toHaveBeenCalledTimes(1);
	});
});
