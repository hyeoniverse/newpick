'use client';

import { ADMIN } from '@/copy';
import { useQuery } from '@tanstack/react-query';
import { fetchNewsletterList } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';
import { CATEGORIES } from '@/constants/categories';

/** 그날 아직 뉴스레터가 없는 분야: 서버가 만들 분야와 같다 (있는 분야는 건너뛴다) */
export default function MissingCategories({ date, label }: { date: string; label: string }) {
	const { data: missing, isPending } = useQuery({
		queryKey: queryKeys.admin.newsletters.day(date),
		queryFn: async () => {
			const query = new URLSearchParams({ from: date, to: date, limit: '100', offset: '0' });
			const data = await fetchNewsletterList(query.toString());
			const done = new Set(data.items.map((item) => item.categoryId));
			return CATEGORIES.filter((category) => category.id !== 0 && !done.has(category.id));
		},
	});
	return (
		<p className="np-admin-dashboard-missing" aria-live="polite">
			<span className="label">{label}</span>
			{isPending
				? ADMIN.jobs.checking
				: !missing?.length
					? ADMIN.jobs.allDone
					: missing.map((category) => category.name).join(' · ')}
		</p>
	);
}
