'use client';

import { ADMIN } from '@/copy';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { kstDate } from '@/utils/formatter';
import { useToast } from '@/hooks/useToast';
import { DatePicker, DateRangePicker } from '@/components/common/DatePicker';

/** 고를 수 있는 가장 긴 기간 (API와 같음) */
export const MAX_RANGE_DAYS = 92;

/** 기간 고르기: 끝은 늘 오늘, 시작은 며칠 전 (어제만 하루) */
export const PRESETS: { key: string; label: string; range: () => { from: string; to: string } }[] = [
	{ key: 'today', label: '오늘', range: () => ({ from: kstDate(0), to: kstDate(0) }) },
	{ key: 'yesterday', label: '어제', range: () => ({ from: kstDate(1), to: kstDate(1) }) },
	{ key: '7d', label: '최근 7일', range: () => ({ from: kstDate(6), to: kstDate(0) }) },
	{ key: '30d', label: '최근 30일', range: () => ({ from: kstDate(29), to: kstDate(0) }) },
];

const isDate = (value: string | null): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

/**
 * 관리자 화면의 기간 · 쿼리 상태 (#21). 모두 주소에 남아 새로 고침 · 공유 · 뒤로 가기에도 그대로.
 * 기간이 없으면 오늘. set으로 바꾸면 페이지(page)는 처음으로
 */
export function useAdminQuery() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const today = kstDate(0);
	const from = isDate(searchParams.get('from')) ? searchParams.get('from')! : today;
	const to = isDate(searchParams.get('to')) ? searchParams.get('to')! : from;
	const page = Math.max(1, Number(searchParams.get('page')) || 1);

	const set = (changes: Record<string, string | number | null | undefined>) => {
		const next = new URLSearchParams(searchParams.toString());
		if (!('page' in changes)) next.delete('page');
		for (const [key, value] of Object.entries(changes)) {
			if (value === null || value === undefined || value === '' || (key === 'page' && value === 1)) next.delete(key);
			else next.set(key, String(value));
		}
		// 기간이 오늘 하루면 주소에서 뺀다
		if (next.get('from') === today && next.get('to') === today) {
			next.delete('from');
			next.delete('to');
		}
		const qs = next.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
	};

	/** 다른 관리자 화면으로 같은 기간을 들고 가는 주소 꼬리 */
	const periodQuery = from === today && to === today ? '' : `?from=${from}&to=${to}`;
	// 직접 지정 중(주소 custom=1): 하루여도 시작 · 종료 두 칸을 보인다
	const custom = searchParams.get('custom') === '1';

	return { today, from, to, page, set, custom, periodQuery, get: (key: string) => searchParams.get(key) ?? '' };
}

/** 지금 기간이 프리셋이면 그 키 */
export function findPreset(from: string, to: string) {
	return PRESETS.find((p) => {
		const r = p.range();
		return r.from === from && r.to === to;
	});
}

/** 오늘 · 어제 · 최근 7일 · 최근 30일 · 직접 지정. 직접 지정은 제목 괄호 속 시작 · 종료 칸으로 고른다 */
export function PeriodPicker() {
	const { from, to, set, custom } = useAdminQuery();
	const preset = custom ? undefined : findPreset(from, to)?.key;

	return (
		<div className="np-admin-period-period" role="group" aria-label="볼 기간">
			{PRESETS.map((p) => (
				<button
					key={p.key}
					type="button"
					aria-pressed={preset === p.key}
					// 고른 기간을 다시 누르면 해제하고 기본(오늘)으로. 관리자 기간은 92일까지라 '전체'가 없다
					onClick={() => set({ ...(preset === p.key ? PRESETS[0] : p).range(), custom: null })}
				>
					{p.label}
				</button>
			))}
			<button
				type="button"
				aria-pressed={!preset}
				onClick={() => set(preset ? { from, to, custom: 1 } : { ...PRESETS[0].range(), custom: null })}
			>
				직접 지정
			</button>
		</div>
	);
}

/**
 * 기간 제목: '최근 7일 ( [2026-10-22] ~ [2026-10-28] )'. 괄호 속 날짜가 그대로 입력칸(누르면 달력).
 * 하루면 칸 하나(그날로), 기간이거나 직접 지정 중이면 공통 기간 고르기(DateRangePicker)의 시작 · 종료 두 칸.
 * 종료는 오늘까지, 92일까지
 */
export function PeriodTitle({ id }: { id?: string }) {
	const { today, from, to, set, custom } = useAdminQuery();
	const { showToast } = useToast();
	const name = (!custom && findPreset(from, to)?.label) || (from === to && !custom ? '하루' : '기간');

	const apply = (start: string, end: string) => {
		if (!start || !end) return;
		const days = (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
		if (days < 0) {
			showToast(ADMIN.period.reversed, 'error');
			return;
		}
		if (days > MAX_RANGE_DAYS) {
			showToast(ADMIN.period.tooLong(MAX_RANGE_DAYS), 'error');
			return;
		}
		set({ from: start, to: end });
	};

	return (
		<span className="np-admin-period-title">
			{/* 섹션 이름은 '최근 7일'처럼 이름만 (칸의 이름표가 섞이지 않게) */}
			<span className="name" id={id}>
				{name}
			</span>
			<span className="paren" aria-hidden>
				(
			</span>
			{from === to && !custom ? (
				<DatePicker size="small" label="날짜" value={from} max={today} onChange={(day) => apply(day, day)} />
			) : (
				// 시작 · 종료 두 칸이지만 어느 칸을 열어도 달력에 기간이 칠해지고, 달력 아래 빠른 선택(오늘 · 최근 7일 …)
				<DateRangePicker
					size="small"
					start={from}
					end={to}
					max={today}
					onChange={({ start, end }) => apply(start, end)}
				/>
			)}
			<span className="paren" aria-hidden>
				)
			</span>
		</span>
	);
}
