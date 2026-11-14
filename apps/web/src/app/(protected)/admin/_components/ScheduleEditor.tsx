'use client';

import { ACTIONS, ADMIN, COMMON } from '@/copy';
import type { ClockTime, Schedule } from '@newpick/shared';
import { useState } from 'react';
import { saveSchedule } from '@/api/admin';
import { errorMessage } from '@/api/client';
import Button from '@/components/common/Button';
import TimePicker from '@/components/common/TimePicker';

/** 예약 시각 (@newpick/shared, api와 같다) */
export type { ClockTime, Schedule };

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
			setError(ADMIN.schedule.order);
			return;
		}
		setPending(true);
		setError('');
		try {
			const data = await saveSchedule(next);
			onSaved(data);
		} catch (e) {
			setError(errorMessage(e, COMMON.changeFailedRetry));
		} finally {
			setPending(false);
		}
	};

	return (
		<form className="np-admin-schedule-editor-editor" onSubmit={save}>
			<h2 className="title">예약 시간 바꾸기</h2>
			<p className="desc">{ADMIN.schedule.lead}</p>
			<div className="row">
				<span className="name">기사 수집</span>
				<span className="when">매시간</span>
				<TimePicker size="small" value={crawl} onChange={setCrawl} label="기사 수집 시각" />
			</div>
			<div className="row">
				<span className="name">AI 요약</span>
				<span className="when">매일</span>
				<TimePicker size="small" value={summary} onChange={setSummary} label="AI 요약 시각" />
			</div>
			<div className="row">
				<span className="name">구독 메일</span>
				<select
					className="np-field-control when"
					value={day}
					onChange={(e) => setDay(Number(e.target.value))}
					aria-label="메일 요일"
				>
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
					{ACTIONS.cancel}
				</Button>
				<Button type="submit" scheme="primary" size="medium" disabled={pending}>
					{pending ? ACTIONS.saving : ACTIONS.save}
				</Button>
			</div>
		</form>
	);
}
