'use client';

import { ACTIONS, ADMIN } from '@/copy';
import { useState } from 'react';
import { LuCalendarPlus } from 'react-icons/lu';
import ModalContent from '@/components/common/modal/ModalContent';
import { kstDate } from '@/utils/formatter';
import MissingCategories from './MissingCategories';

/** 빠진 날 채우기 창: 날짜 하나 고르기 (어제부터 모은 기사가 남아 있는 29일 전까지) */
export default function FillDay({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (date: string) => void }) {
	const [date, setDate] = useState(kstDate(1));
	return (
		<ModalContent
			icon={<LuCalendarPlus />}
			title="누락된 날짜 채우기"
			content={ADMIN.jobs.fillBody}
			outlineButton={ACTIONS.cancel}
			filledButton="생성"
			onCancelClick={onCancel}
			onConfirmClick={() => date && onConfirm(date)}
		>
			<label className="np-admin-dashboard-fill-day">
				<span className="np-field-label">날짜</span>
				<input
					type="date"
					className="np-field-control"
					value={date}
					min={kstDate(29)}
					max={kstDate(1)}
					onChange={(event) => setDate(event.target.value)}
				/>
			</label>
			{date && <MissingCategories date={date} label="생성 항목" />}
		</ModalContent>
	);
}
