'use client';

import { ADMIN } from '@/copy';
import { ROUTES } from '@/constants/routes';
import type { Dashboard as DashboardData } from '@newpick/shared';
import { LuArrowRight } from 'react-icons/lu';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import MoreLink from '@/components/common/MoreLink';
import { mapIdToTitle } from '@/utils/mapInterests';
import { useAdminQuery } from '../period';
import { when } from '../../_lib/format';

/** 기간에 발행한 뉴스레터 목록 (관심사 · 제목 · 시각) */
export default function NewsletterSummary({ newsletters }: { newsletters: DashboardData['newsletters'] }) {
	const { today, periodQuery } = useAdminQuery();
	return (
		<section aria-labelledby="dash-newsletters">
			<div className="section-head">
				<Title as="h2" size="extraSmall" weight="bold" className="section-title">
					<span id="dash-newsletters">발행</span>
				</Title>
				<MoreLink href={`${ROUTES.admin.newsletters}${periodQuery}`}>
					전체 {newsletters.total.toLocaleString()}편 보기 <LuArrowRight aria-hidden />
				</MoreLink>
			</div>
			{newsletters.items.length === 0 ? (
				<Text size="small" color="subText">
					{ADMIN.empty.newsletters}
				</Text>
			) : (
				<ul className="list">
					{newsletters.items.map((n) => (
						<li key={n.id}>
							<span className="category">{mapIdToTitle([n.categoryId])[0]}</span>
							<a href={ROUTES.article(n.id)} className="title">
								{n.title}
							</a>
							<span className="time">{when(n.createdAt, today)}</span>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
