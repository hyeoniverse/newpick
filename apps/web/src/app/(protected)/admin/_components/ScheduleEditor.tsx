'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import Button from '@/components/common/Button';
import { fieldControl } from '@/components/common/field';
import TimePicker from '@/components/common/TimePicker';

export interface ClockTime {
	hour: number;
	minute: number;
}

export interface Schedule {
	crawl: ClockTime;
	summary: ClockTime;
	mail: ClockTime & { day: number };
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => String(n).padStart(2, '0');
export const clock = ({ hour, minute }: ClockTime) => `${pad(hour)}:${pad(minute)}`;
const parse = (value: string): ClockTime => {
	const [hour, minute] = value.split(':').map(Number);
	return { hour, minute };
};
const minutesOf = ({ hour, minute }: ClockTime) => hour * 60 + minute;

/** '매일 08:40' · '매주 월요일 08:40' */
export const describe = (time: ClockTime, day = 7) =>
	day === 7 ? `매일 ${clock(time)}` : `매주 ${DAYS[day]}요일 ${clock(time)}`;

interface Props {
	initial: Schedule;
	onSaved: (schedule: Schedule) => void;
	onCancel: () => void;
}

/**
 * 예약 작업 시간 바꾸기 (#21). 수집 → AI 요약 → 메일 순서여야 저장된다
 * (요약은 그날 수집한 기사로, 메일은 그날 요약으로 만든다). 저장하면 서버가 바로 다시 건다
 */
export default function ScheduleEditor({ initial, onSaved, onCancel }: Props) {
	const [crawl, setCrawl] = useState(clock(initial.crawl));
	const [summary, setSummary] = useState(clock(initial.summary));
	const [mail, setMail] = useState(clock(initial.mail));
	const [day, setDay] = useState(initial.mail.day);
	const [error, setError] = useState('');
	const [pending, setPending] = useState(false);

	const save = async (event: React.FormEvent) => {
		event.preventDefault();
		const next: Schedule = { crawl: parse(crawl), summary: parse(summary), mail: { ...parse(mail), day } };
		if (!(minutesOf(next.crawl) < minutesOf(next.summary) && minutesOf(next.summary) < minutesOf(next.mail))) {
			setError('기사 수집 → AI 요약 → 구독 메일 순서로, 앞 작업보다 늦은 시각을 골라 주세요.');
			return;
		}
		setPending(true);
		setError('');
		try {
			const { data } = await apiFetch<{ data: Schedule }>(API_ENDPOINTS.ADMIN.SCHEDULE(), {
				method: 'PUT',
				body: next,
			});
			onSaved(data);
		} catch (e) {
			setError(e instanceof ApiError ? e.message : '바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.');
		} finally {
			setPending(false);
		}
	};

	return (
		<StyledEditor onSubmit={save}>
			<h2 className="title">예약 시간 바꾸기</h2>
			<p className="desc">
				기사 수집 → AI 요약 → 구독 메일 순서로 돌아요. 수집은 이 시각부터 3시간마다 하루 8번 하고, 요약은 그 전 24시간
				동안 모은 기사로, 메일은 그날 요약으로 만들어서 앞 작업보다 늦게 잡아야 해요. 저장하면 바로 적용돼요.
			</p>
			<div className="row">
				<span className="name">기사 수집</span>
				<span className="when">3시간마다</span>
				<TimePicker size="small" value={crawl} onChange={setCrawl} label="기사 수집 시각" />
			</div>
			<div className="row">
				<span className="name">AI 요약</span>
				<span className="when">매일</span>
				<TimePicker size="small" value={summary} onChange={setSummary} label="AI 요약 시각" />
			</div>
			<div className="row">
				<span className="name">구독 메일</span>
				<select className="when" value={day} onChange={(e) => setDay(Number(e.target.value))} aria-label="메일 요일">
					<option value={7}>매일</option>
					{DAYS.map((d, i) => (
						<option key={d} value={i}>
							매주 {d}요일
						</option>
					))}
				</select>
				<TimePicker size="small" value={mail} onChange={setMail} label="구독 메일 시각" />
			</div>
			{error && (
				<p className="error" role="alert">
					{error}
				</p>
			)}
			<div className="actions">
				<Button type="button" scheme="outline" size="medium" onClick={onCancel}>
					취소
				</Button>
				<Button type="submit" scheme="primary" size="medium" disabled={pending}>
					{pending ? '저장하는 중…' : '저장'}
				</Button>
			</div>
		</StyledEditor>
	);
}

const StyledEditor = styled.form`
	display: flex;
	flex-direction: column;
	gap: 0.875rem;

	.title {
		font-size: ${({ theme }) => theme.heading.extraSmall.fontSize};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
	}

	.desc {
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}

	.row {
		display: grid;
		grid-template-columns: 6rem 1fr 8.5rem;
		align-items: center;
		gap: 0.75rem;
		padding: 0.25rem 0;
	}

	.name {
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
	}

	.when {
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	select.when {
		${fieldControl}
		height: 2.5rem;
		color: ${({ theme }) => theme.color.text};
	}

	/* 시각 칸 이름표는 화면 읽기 프로그램용으로만 (줄 이름이 보이므로) */
	.row label {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.error {
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.error};
		word-break: keep-all;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
`;
