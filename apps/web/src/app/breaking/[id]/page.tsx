import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BREAKING } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { DEFAULT_OG_IMAGE } from '@/constants/site';
import { fetchBreakingItem } from '@/api/edition';
import { Articles, Label } from '@/components/common/Breaking';
import Image from '@/components/common/Image';
import { kstDateTime } from '../time';

const COPY = BREAKING.archive;
type Params = { params: Promise<{ id: string }> };

export const revalidate = 60;

/** 숫자가 아니면 부르지 않는다. 없거나 아직 나가지 않았으면 null */
const load = (id: string) => (/^\d+$/.test(id) ? fetchBreakingItem(id) : Promise.resolve(null));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const item = await load((await params).id).catch(() => undefined);
	if (item === null) return { title: '찾을 수 없는 속보', robots: { index: false } };
	if (!item) return {};
	const title = `[속보] ${item.headline}`;
	const images = item.image ? [{ url: item.image, alt: item.headline }] : [DEFAULT_OG_IMAGE];
	return {
		title,
		description: item.reason,
		alternates: { canonical: ROUTES.breaking(item.id) },
		openGraph: { type: 'article', url: ROUTES.breaking(item.id), title, description: item.reason, images },
	};
}

/** 속보 하나 (메일의 '뉴픽에서 보기'): 사진 · 속보 · 시각 · 사건 · 이유 · 관련 기사 */
export default async function BreakingPage({ params }: Params) {
	const item = await load((await params).id);
	if (!item) notFound();
	return (
		<article className="mx-auto flex w-full max-w-[760px] flex-col gap-5 py-12 mobile:py-8">
			<div className="flex items-center gap-3">
				<Label />
				<time dateTime={item.detectedAt} className="text-small text-sub-text">
					{kstDateTime(item.detectedAt)}
				</time>
			</div>
			<h1 className="m-0 text-[2.25rem] leading-tight font-bold break-keep mobile:text-[1.625rem]">{item.headline}</h1>
			{item.reason && <p className="m-0 text-large leading-relaxed text-sub-text">{item.reason}</p>}
			{item.image && (
				<Image
					src={item.image}
					alt=""
					ratio="wide"
					sizes="(max-width: 767px) 100vw, 760px"
					className="w-full rounded-surface"
					priority
				/>
			)}
			<section className="flex flex-col gap-2">
				<h2 className="m-0 text-medium font-bold">{COPY.articles}</h2>
				<Articles notice={item} />
			</section>
			<Link href={ROUTES.breakingArchive} className="w-fit font-semi-bold text-primary">
				← {COPY.back}
			</Link>
		</article>
	);
}
