'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { HOME } from '@/copy';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { useTagFollows } from '@/hooks/useTagFollows';
import { monthDay } from '@/utils/formatter';
import { SECTION, SectionHeader } from './SectionHeader';

const COPY = HOME.personal;
/** 칸마다 보이는 수 */
const LIMIT = 3;

/** 빈 칸 안내: 아직 없다는 것 + 어떻게 하면 여기에 소식이 모이는지 */
function Empty({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
	return (
		<p className="m-0 flex flex-col gap-2 rounded-surface bg-surface p-5 text-small leading-relaxed text-sub-text">
			<strong className="text-medium font-semi-bold text-text">{title}</strong>
			{text}
			<Link href={href} className="self-start font-semi-bold text-primary no-underline hover:underline">
				{action}
			</Link>
		</p>
	);
}

function Column({ title, more, children }: { title: string; more?: string; children: React.ReactNode }) {
	return (
		<div className="flex min-w-0 flex-col gap-3">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="m-0 text-medium font-semi-bold">{title}</h3>
				{more && (
					<Link href={more} className="shrink-0 text-small text-sub-text no-underline hover:text-primary">
						{COPY.more}
					</Link>
				)}
			</div>
			{children}
		</div>
	);
}

/**
 * 나를 위한 소식 (로그인했을 때만, 핵심 3줄 바로 아래): 지켜보는 소식에 이어진 새 소식 · 팔로우한 태그의 새 뉴스레터.
 * 마이페이지 '지켜보기'와 같은 데이터(GET /mypage/follows · /mypage/tag-follows)를 홈에서 먼저 보여 준다.
 * 홈에서 봤다고 '본 것'으로 바꾸지는 않는다 (머리글 수는 마이페이지에서 볼 때 줄어든다)
 */
export default function PersonalSection() {
	const { user } = useAuth();
	const { data: follows, isPending: followsPending } = useFollows();
	const { follows: tagFollows, isPending: tagsPending } = useTagFollows();
	if (!user || followsPending || tagsPending) return null;

	// 지켜보는 소식의 새 소식: 안 본 것 먼저, 그다음 새것부터
	const updates = (follows ?? [])
		.flatMap((follow) => follow.updates.map((update) => ({ ...update, of: follow.heading })))
		.sort((a, b) => Number(!b.seenAt) - Number(!a.seenAt) || b.createdAt.localeCompare(a.createdAt))
		.slice(0, LIMIT);
	// 팔로우한 태그: 태그마다 가장 새 뉴스레터 하나, 새것이 나온 태그부터
	const tags = tagFollows
		.map((follow) => ({ tag: follow.tag, latest: follow.news.at(-1) }))
		.filter((t): t is { tag: string; latest: NonNullable<typeof t.latest> } => !!t.latest)
		.sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt))
		.slice(0, LIMIT);

	return (
		<section className={SECTION} data-track-section="home-personal">
			<SectionHeader eyebrow={COPY.eyebrow} title={COPY.title} />
			<div className="grid w-full grid-cols-2 gap-10 tablet:grid-cols-1 tablet:gap-8">
				<Column title={COPY.follows} more={updates.length ? ROUTES.mypage('follows') : undefined}>
					{updates.length ? (
						<ul className="m-0 flex list-none flex-col p-0">
							{updates.map((update) => (
								<li key={update.id} className="border-b border-light-grey last:border-b-0">
									<Link
										href={ROUTES.article(update.newsletter.id)}
										className="group flex flex-col gap-1 py-3 text-inherit no-underline"
									>
										<span className="flex items-baseline gap-2 text-small">
											{!update.seenAt && <span className="font-semi-bold text-primary">{COPY.new}</span>}
											<span className="truncate text-sub-text">{COPY.followOf(update.of)}</span>
										</span>
										<strong className="line-clamp-2 leading-snug font-semi-bold group-hover:underline">
											{update.heading}
										</strong>
										<span className="text-small text-sub-text">
											{update.newsletter.category.name} · {monthDay(update.createdAt)}
											{update.reason && ` · ${update.reason}`}
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<Empty
							title={COPY.followsEmptyTitle}
							text={COPY.followsEmpty}
							href={ROUTES.articles}
							action={COPY.followsAction}
						/>
					)}
				</Column>
				<Column title={COPY.tags} more={tags.length ? ROUTES.mypage('follows') : undefined}>
					{tags.length ? (
						<ul className="m-0 flex list-none flex-col p-0">
							{tags.map(({ tag, latest }) => (
								<li key={tag} className="border-b border-light-grey last:border-b-0">
									<Link
										href={ROUTES.article(latest.id)}
										className="group flex flex-col gap-1 py-3 text-inherit no-underline"
									>
										<span className="text-small font-semi-bold text-primary">#{tag}</span>
										<strong className="line-clamp-2 leading-snug font-semi-bold group-hover:underline">
											{latest.title}
										</strong>
										<span className="text-small text-sub-text">
											{latest.category} · {monthDay(latest.createdAt)}
										</span>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<Empty title={COPY.tagsEmptyTitle} text={COPY.tagsEmpty} href={ROUTES.tags} action={COPY.tagsAction} />
					)}
				</Column>
			</div>
		</section>
	);
}
