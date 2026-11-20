'use client';

import { ACTIONS, ADMIN } from '@/copy';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LuCalendarPlus } from 'react-icons/lu';
import { fetchNewsletterList } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';
import { CATEGORIES } from '@/constants/categories';
import { DatePicker } from '@/components/common/datepicker/DatePicker';
import InputCheck from '@/components/common/InputCheck';
import ModalContent from '@/components/common/modal/ModalContent';
import { kstDate } from '@/utils/formatter';

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

/** 그날 관심사마다: 없으면 새로 만들기, 있으면 그 뉴스레터 다시 쓰기 */
function useDayRows(date: string) {
	return useQuery({
		queryKey: queryKeys.admin.newsletters.day(date),
		queryFn: async (): Promise<Row[]> => {
			const query = new URLSearchParams({ from: date, to: date, limit: '100', offset: '0' });
			const { items } = await fetchNewsletterList(query.toString());
			return CATEGORIES.filter((category) => category.id !== 0).flatMap((category): Row[] => {
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
 * 빠진 날 채우기 · 다시 쓰기 창: 날짜를 고르면 그날 관심사를 모두 보여 준다.
 * 빠진 관심사는 처음부터 골라 두고(새로 만들기), 이미 있는 뉴스레터는 골라서 다시 쓴다 (내용이 마음에 들지 않을 때).
 * 모은 기사가 남아 있는 29일 전부터 오늘까지
 */
export default function FillDay({
	onCancel,
	onConfirm,
}: {
	onCancel: () => void;
	onConfirm: (target: FixDayTarget) => void;
}) {
	const [date, setDate] = useState(kstDate(1));
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

	const chosen = (rows ?? []).filter((row) => picked.has(row.key));
	const target: FixDayTarget = {
		date,
		categoryIds: chosen.flatMap((row) => (row.kind === 'missing' ? [row.categoryId] : [])),
		newsletterIds: chosen.flatMap((row) => (row.kind === 'existing' ? [row.newsletterId] : [])),
	};
	const missing = rows?.filter((row) => row.kind === 'missing') ?? [];
	const existing = rows?.filter((row) => row.kind === 'existing') ?? [];

	return (
		<ModalContent
			icon={<LuCalendarPlus />}
			title="빠진 날 채우기 · 다시 쓰기"
			content={ADMIN.jobs.fillBody}
			outlineButton={ACTIONS.cancel}
			filledButton={chosen.length ? `${chosen.length}편 실행` : '실행'}
			confirmDisabled={!chosen.length}
			onCancelClick={onCancel}
			onConfirmClick={() => chosen.length && onConfirm(target)}
		>
			<div className="np-admin-dashboard-fill-day">
				<DatePicker
					label="날짜"
					value={date}
					min={kstDate(29)}
					max={kstDate(0)}
					onChange={(next) => next && setDate(next)}
				/>
				{isPending ? (
					<p className="np-admin-dashboard-missing" aria-live="polite">
						{ADMIN.jobs.checking}
					</p>
				) : (
					<>
						<fieldset className="group">
							<legend>새로 만들기 · 그날 없는 관심사</legend>
							{missing.length ? (
								missing.map((row) => (
									<InputCheck
										key={row.key}
										name={`fill-${row.key}`}
										label={row.name}
										checked={picked.has(row.key)}
										onCheckedChange={(on) => toggle(row.key, on)}
									/>
								))
							) : (
								<p className="empty">{ADMIN.jobs.noMissing}</p>
							)}
						</fieldset>
						{existing.length > 0 && (
							<fieldset className="group">
								<legend>다시 쓰기 · 이미 있는 뉴스레터</legend>
								{existing.map((row) =>
									row.kind === 'existing' ? (
										<InputCheck
											key={row.key}
											name={`fill-${row.key}`}
											label={`${row.name} · ${row.title}`}
											checked={picked.has(row.key)}
											onCheckedChange={(on) => toggle(row.key, on)}
										/>
									) : null,
								)}
							</fieldset>
						)}
					</>
				)}
			</div>
		</ModalContent>
	);
}
