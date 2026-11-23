'use client';

import type { HomeStory } from '@newpick/shared';
import { ROUTES } from '@/constants/routes';
import Card from '@/components/common/Card';
import { HOME } from '@/copy';
import { SECTION, SectionHeader } from './SectionHeader';

const COPY = HOME.today;

/** 오늘의 트렌드: 오늘 가장 핫하고 중요한 소식 (중요도와 오늘 조회를 함께 본 것, 3줄과 겹치지 않게) */
export default function TodayTrendSection({ stories }: { stories: HomeStory[] }) {
	if (!stories.length) return null;
	return (
		<section className={SECTION} data-track-section="home-today-trend">
			<SectionHeader title={COPY.trend} note={COPY.trendNote} />
			{/* 휴대폰은 옆으로 넘기는 한 줄 (큰 카드 4장을 세로로 쌓으면 화면 두 개 높이가 넘었다) */}
			<ul className="m-0 grid w-full list-none grid-cols-4 gap-6 p-0 tablet:grid-cols-2 mobile:flex mobile:snap-x mobile:snap-mandatory mobile:gap-4 mobile:overflow-x-auto mobile:pb-2">
				{stories.map((story) => (
					<li
						key={`${story.newsletterId}-${story.storyIndex}`}
						className="min-w-0 mobile:w-[78%] mobile:shrink-0 mobile:snap-start"
					>
						<Card
							deferImage
							data={{
								id: `${story.newsletterId}-${story.storyIndex}`,
								url: ROUTES.article(story.newsletterId),
								image: story.image ?? undefined,
								header: story.category,
								main: { title: story.heading, description: story.line },
							}}
						/>
					</li>
				))}
			</ul>
		</section>
	);
}
