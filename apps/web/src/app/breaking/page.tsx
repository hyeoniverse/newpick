import type { Metadata } from 'next';
import Link from 'next/link';
import { BREAKING } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { pageMetadata } from '@/constants/site';
import { fetchBreakingArchive } from '@/api/edition';
import { Label } from '@/components/common/Breaking';
import { kstDateTime } from './time';

const COPY = BREAKING.archive;

export const metadata: Metadata = pageMetadata(COPY.title, COPY.meta, ROUTES.breakingArchive);
/** 속보는 하루 최대 3건이라 1분마다 새로 만들면 충분하다 */
export const revalidate = 60;

/** 지난 속보: 나간 속보를 새것부터. 누르면 속보 하나 (메일의 '뉴픽에서 보기'와 같은 화면) */
export default async function BreakingArchivePage() {
	const items = await fetchBreakingArchive().catch(() => []);
	return (
		<section className="mx-auto flex w-full max-w-[760px] flex-col gap-8 py-12 mobile:py-8">
			<div className="flex flex-col gap-2">
				<Label />
				<h1 className="m-0 text-[2rem] font-bold mobile:text-[1.5rem]">{COPY.title}</h1>
				<p className="m-0 text-sub-text">{COPY.lead}</p>
			</div>
			{items.length ? (
				<ol className="m-0 flex list-none flex-col p-0">
					{items.map((item) => (
						<li key={item.id} className="border-b border-solid border-border py-5 first:border-t">
							<Link href={ROUTES.breaking(item.id)} className="group flex flex-col gap-1.5 text-inherit no-underline">
								<time dateTime={item.detectedAt} className="text-small text-sub-text">
									{kstDateTime(item.detectedAt)}
								</time>
								<strong className="text-large leading-snug font-bold break-keep group-hover:underline">
									{item.headline}
								</strong>
								{item.reason && <span className="line-clamp-2 break-keep text-sub-text">{item.reason}</span>}
							</Link>
						</li>
					))}
				</ol>
			) : (
				<p className="m-0 rounded-surface bg-surface p-8 text-center text-sub-text">{COPY.empty}</p>
			)}
		</section>
	);
}
