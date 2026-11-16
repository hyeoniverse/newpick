'use client';

import { ADMIN } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { useState } from 'react';
import type { Dashboard as DashboardData } from '@newpick/shared';
import { LuArrowRight, LuChevronDown } from 'react-icons/lu';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import MoreLink from '@/components/common/MoreLink';
import { useAdminQuery } from '../period';
import MailRecipients from './MailRecipients';

/** 날짜별 발송: 최근 5일, 누르면 그날 받은 사람 */
export default function MailSummary({ mail }: { mail: DashboardData['mail'] }) {
	const { today, periodQuery } = useAdminQuery();
	const [openDay, setOpenDay] = useState<string | null>(null);
	return (
		<section aria-labelledby="dash-mail">
			<div className="section-head">
				<Title as="h2" size="extraSmall" weight="bold" className="section-title">
					<span id="dash-mail">날짜별 발송</span>
				</Title>
				<MoreLink href={`${ROUTES.admin.mail}${periodQuery}`}>
					발송 기록 보기 <LuArrowRight aria-hidden />
				</MoreLink>
			</div>
			{mail.byDay.length === 0 ? (
				<Text size="small" color="subText">
					{ADMIN.empty.mails}
				</Text>
			) : (
				<ul className="list">
					{mail.byDay.slice(0, 5).map((row) => {
						const open = openDay === row.day;
						return (
							<li key={row.day} className="mail-day">
								{/* 누르면 그날 받은 사람(이메일 · 받은 관심사 · 보낸 시각) */}
								<button
									type="button"
									className="day-toggle"
									aria-expanded={open}
									onClick={() => setOpenDay(open ? null : row.day)}
								>
									<span className="title">{row.day}</span>
									<span className="time">{row.recipients.toLocaleString()}명</span>
									<LuChevronDown aria-hidden className={open ? 'chevron open' : 'chevron'} />
								</button>
								{open && <MailRecipients date={row.day} today={today} />}
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
