'use client';

import { ACTIONS, ADMIN } from '@/copy';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LuChevronLeft } from 'react-icons/lu';
import { fetchNewsletterList } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';
import { CATEGORIES } from '@/constants/categories';
import { DatePicker } from '@/components/common/datepicker/DatePicker';
import InputCheck from '@/components/common/InputCheck';
import ModalContent from '@/components/common/modal/ModalContent';
import { kstDate, kstDateOf } from '@/utils/formatter';
import type { NewsletterListItem } from '@newpick/shared';

/** 모은 기사가 남아 있는 날 수 (그보다 오래된 날은 만들 재료가 없다) */
const KEEP_DAYS = 29;
const CATEGORY_LIST = CATEGORIES.filter((category) => category.id !== 0);

export interface FixDayTarget {
	date: string;
	/** 새로 만들 관심사 (그날 없는 것) */
	categoryIds: number[];
	/** 다시 쓸 뉴스레터 (그날 이미 있는 것) */
	newsletterIds: number[];
}

/** 한 줄: 그날 없는 관심사(새로 만들기) 또는 이미 있는 뉴스레터(다시 쓰기) */
type Row =
	| { key: string; kind: 'missing'; categoryId: number; name: string }
	| { key: string; kind: 'existing'; newsletterId: number; name: string; title: string };

/** 기간 안 뉴스레터 전부 (한 번에 100편까지라 나눠 받는다) */
async function fetchAllNewsletters(from: string, to: string) {
	const items: NewsletterListItem[] = [];
	for (let offset = 0; ; offset += 100) {
		const query = new URLSearchParams({ from, to, limit: '100', offset: String(offset) });
		const page = await fetchNewsletterList(query.toString());
		items.push(...page.items);
		if (page.items.length < 100 || items.length >= page.total) return items;
	}
}

/**
 * 빠진 날: 기사가 남아 있는 날 중 관심사가 하나라도 빠진 날, 최근 날부터.
 * 서비스를 시작하기 전(그 기간에 처음 발행한 날보다 앞)은 빼고, 오늘은 예약 실행이 아직일 수 있어 뺀다
 */
function useMissingDays() {
	const from = kstDate(KEEP_DAYS);
	const to = kstDate(0);
	return useQuery({
		queryKey: queryKeys.admin.newsletters.range(from, to),
		queryFn: async () => {
			const items = await fetchAllNewsletters(from, to);
			const byDay = new Map<string, Set<number>>();
			for (const item of items) {
				const day = kstDateOf(item.createdAt);
				byDay.set(day, (byDay.get(day) ?? new Set()).add(item.categoryId));
			}
			const first = [...byDay.keys()].sort()[0];
			const days: { date: string; missing: string[] }[] = [];
			for (let ago = 1; ago <= KEEP_DAYS; ago++) {
				const date = kstDate(ago);
				if (!first || date < first) break;
				const made = byDay.get(date) ?? new Set();
				const missing = CATEGORY_LIST.filter((category) => !made.has(category.id)).map((category) => category.name);
				if (missing.length) days.push({ date, missing });
			}
			return days;
		},
	});
}

/** 'MM-DD (요일)' */
const dayLabel = (date: string) =>
	`${date.slice(5)} (${new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'Asia/Seoul' }).format(new Date(`${date}T12:00:00+09:00`))})`;

/** 그날 관심사마다: 없으면 새로 만들기, 있으면 그 뉴스레터 다시 쓰기 */
function useDayRows(date: string | null) {
	return useQuery({
		queryKey: queryKeys.admin.newsletters.day(date ?? ''),
		enabled: !!date,
		queryFn: async (): Promise<Row[]> => {
			const items = await fetchAllNewsletters(date!, date!);
			return CATEGORY_LIST.flatMap((category): Row[] => {
				const made = items.filter((item) => item.categoryId === category.id);
				if (!made.length)
					return [{ key: `c${category.id}`, kind: 'missing', categoryId: category.id, name: category.name }];
				return made.map((item) => ({
					key: `n${item.id}`,
					kind: 'existing',
					newsletterId: item.id,
					name: category.name,
					title: item.title,
				}));
			});
		},
	});
}

/**
 * 빠진 날 채우기 · 다시 쓰기 창. 1단계: 빠진 날을 자동으로 늘어놓고(다른 날은 달력으로) 날짜를 고른다.
 * 2단계: 그날 관심사를 모두 보여 준다. 빠진 관심사는 처음부터 골라 두고(새로 만들기),
 * 이미 있는 뉴스레터는 골라서 다시 쓴다 (내용이 마음에 들지 않을 때). 모은 기사가 남아 있는 29일 전부터 오늘까지
 */
export default function FillDay({
	onCancel,
	onConfirm,
}: {
	onCancel: () => void;
	onConfirm: (target: FixDayTarget) => void;
}) {
	const [date, setDate] = useState<string | null>(null);
	const missingDays = useMissingDays();
	const { data: rows, isPending } = useDayRows(date);
	const [picked, setPicked] = useState<Set<string>>(new Set());

	// 날짜를 바꾸면 그날 빠진 관심사만 골라 둔다
	useEffect(() => {
		setPicked(new Set((rows ?? []).filter((row) => row.kind === 'missing').map((row) => row.key)));
	}, [rows]);

	const toggle = (key: string, on: boolean) =>
		setPicked((prev) => {
			const next = new Set(prev);
			if (on) next.add(key);
			else next.delete(key);
			return next;
		});

	const chosen = date ? (rows ?? []).filter((row) => picked.has(row.key)) : [];
	const target: FixDayTarget = {
		date: date ?? '',
		categoryIds: chosen.flatMap((row) => (row.kind === 'missing' ? [row.categoryId] : [])),
		newsletterIds: chosen.flatMap((row) => (row.kind === 'existing' ? [row.newsletterId] : [])),
	};
	const missing = rows?.filter((row) => row.kind === 'missing') ?? [];
	const existing = rows?.filter((row) => row.kind === 'existing') ?? [];

	return (
		<ModalContent
			title="빠진 날 채우기 · 다시 쓰기"
			content={ADMIN.jobs.fillBody}
			outlineButton={ACTIONS.cancel}
			filledButton={chosen.length ? `${chosen.length}편 실행` : '실행'}
			confirmDisabled={!chosen.length}
			onCancelClick={onCancel}
			onConfirmClick={() => date && chosen.length && onConfirm(target)}
		>
			<div className="np-admin-dashboard-fill-day">
				{!date ? (
					<>
						{/* fieldset은 넘친 내용을 잘라 스크롤하지 못해(칩이 칸 밖으로 넘침) 스크롤하는 칸은 div + role=group */}
						<div className="group filler" role="group" aria-labelledby="fill-days-legend">
							<p id="fill-days-legend" className="legend">
								관심사가 빠진 날 · 최근 {KEEP_DAYS}일
							</p>
							{missingDays.isPending ? (
								<p className="empty">{ADMIN.jobs.checking}</p>
							) : missingDays.data?.length ? (
								<ul className="days">
									{missingDays.data.map((day) => (
										<li key={day.date}>
											<button
												type="button"
												className="day"
												// 무엇이 빠졌는지는 마우스를 올리거나 화면 읽기로 (칸은 짧게)
												title={day.missing.join(', ')}
												aria-label={`${dayLabel(day.date)} · ${day.missing.length}개 빠짐: ${day.missing.join(', ')}`}
												onClick={() => setDate(day.date)}
											>
												<span className="when">{dayLabel(day.date)}</span>
												<span className="what">{day.missing.length}개 빠짐</span>
											</button>
										</li>
									))}
								</ul>
							) : (
								<p className="empty">{ADMIN.jobs.noMissingDays}</p>
							)}
						</div>
						{/* 빠진 관심사가 없는 날도 골라 다시 쓸 수 있게 */}
						<DatePicker
							label="다른 날짜 (다시 쓰기)"
							value={null}
							min={kstDate(KEEP_DAYS)}
							max={kstDate(0)}
							onChange={(next) => next && setDate(next)}
						/>
					</>
				) : (
					<>
						<div className="picked-day">
							<button type="button" className="back" onClick={() => setDate(null)}>
								<LuChevronLeft aria-hidden /> 날짜 다시 고르기
							</button>
							<strong>{dayLabel(date)}</strong>
						</div>
						{isPending ? (
							<p className="np-admin-dashboard-missing" aria-live="polite">
								{ADMIN.jobs.checking}
							</p>
						) : (
							<>
								<fieldset className="group">
									<legend>새로 만들기 · 그날 없는 관심사</legend>
									{missing.length ? (
										<div className="checks">
											{missing.map((row) => (
												<InputCheck
													key={row.key}
													name={`fill-${row.key}`}
													label={row.name}
													checked={picked.has(row.key)}
													onCheckedChange={(on) => toggle(row.key, on)}
												/>
											))}
										</div>
									) : (
										<p className="empty">{ADMIN.jobs.noMissing}</p>
									)}
								</fieldset>
								{existing.length > 0 && (
									<div className="group filler" role="group" aria-labelledby="fill-rewrite-legend">
										<p id="fill-rewrite-legend" className="legend">
											다시 쓰기 · 이미 있는 뉴스레터
										</p>
										<p className="note">{ADMIN.jobs.rewriteNote}</p>
										{existing.map((row) =>
											row.kind === 'existing' ? (
												<InputCheck
													key={row.key}
													name={`fill-${row.key}`}
													label={`${row.name} · ${row.title}`}
													className="title-check"
													checked={picked.has(row.key)}
													onCheckedChange={(on) => toggle(row.key, on)}
												/>
											) : null,
										)}
									</div>
								)}
							</>
						)}
					</>
				)}
			</div>
		</ModalContent>
	);
}
