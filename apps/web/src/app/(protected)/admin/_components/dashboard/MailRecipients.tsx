'use client';

import { ADMIN, COMMON } from '@/copy';
import { useQuery } from '@tanstack/react-query';
import { fetchMailRecipients } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';
import { mapIdToTitle } from '@/utils/mapInterests';
import { when } from '../../_lib/format';

/** 그날 받은 사람: 펼칠 때만 불러온다 */
export default function MailRecipients({ date, today }: { date: string; today: string }) {
	const { data, isPending, isError } = useQuery({
		queryKey: queryKeys.admin.mailRecipients(date),
		queryFn: () => fetchMailRecipients(date),
	});
	if (isPending) return <p className="recipients-state">{COMMON.loading}</p>;
	if (isError) return <p className="recipients-state">{ADMIN.jobs.recipientsFailed}</p>;
	if (data.length === 0) return <p className="recipients-state">{ADMIN.empty.recipients}</p>;
	return (
		<ul className="recipients">
			{data.map((row) => (
				<li key={row.email}>
					<span className="email">{row.email}</span>
					<span className="cats">{mapIdToTitle(row.categoryIds).join(' · ')}</span>
					<span className="time">{when(row.sentAt, today)}</span>
				</li>
			))}
		</ul>
	);
}
