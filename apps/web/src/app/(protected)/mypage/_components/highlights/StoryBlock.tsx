'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { LuNewspaper } from 'react-icons/lu';
import Image from '@/components/common/Image';
import Tags from '@/components/common/Tags';
import { monthDay } from '@/utils/formatter';
import { dayLabel, sectionName, type StoryBlock as Block } from '../../_lib/highlightGroups';
import HighlightItem from './HighlightItem';
import type { HighlightSelection } from './useHighlightSelection';

/** 작은 화면에서 블록마다 처음에 보일 문장 수 (나머지는 '문장 N개 더 보기') */
const QUOTES_SMALL = 2;

/**
 * 소식 블록 하나: 스크랩한 날 · 어느 뉴스레터인지 · 소식 제목, 왼쪽 그림 · 관심사 · 태그, 오른쪽 상자에 그날 스크랩한 문장들.
 * 폴더는 문장마다 정하므로 끌기도 문장 하나씩 (블록째 끌지 않는다)
 */
export default function StoryBlock({
	block,
	day,
	folderNameOf,
	focused,
	open,
	onOpen,
	selection,
}: {
	block: Block;
	/** 스크랩한 날 'YYYY-MM-DD' */
	day: string;
	/** 들어 있는 폴더 이름 ('모든 스크랩'에서 볼 때만, 아니면 undefined) */
	folderNameOf: (folderId: number | null) => string | undefined;
	/** 알림에서 와서 강조할 스크랩 번호 */
	focused: number | null;
	/** 작은 화면에서 접어 둔 문장까지 펼쳤는지 */
	open: boolean;
	onOpen: () => void;
	selection: HighlightSelection;
}) {
	const newsletter = block.items[0].newsletter;
	const href = ROUTES.article(block.newsletterId);
	// 블록 제목 · 사진은 그 소식 것 (브리핑 · 구역 모름이면 뉴스레터 것), 어느 뉴스레터인지는 위에 작게
	const { index, name } = sectionName(block.items[0]);
	const title = name ?? newsletter?.title ?? `뉴스레터 #${block.newsletterId}`;
	const image = block.items[0].sectionImage ?? newsletter?.image;
	const tags = block.items[0].sectionTags ?? [];
	const showAll = open || block.items.some((h, i) => i >= QUOTES_SMALL && h.id === focused);

	return (
		<article className="news">
			{/* 스크랩한 날 · 어느 뉴스레터의 소식인지 (제목은 소식 제목이라 위에 작게) */}
			<p className="news-date">
				{dayLabel(day)}
				{name && newsletter && (
					<Link href={href} className="news-from">
						{newsletter.title}
					</Link>
				)}
			</p>
			<Link href={href} className="news-title">
				<h3>
					{index && <span className="story-index">{index}</span>}
					{title}
				</h3>
			</Link>
			<div className="news-body">
				<div className="news-media">
					<Link href={href} className="news-image" tabIndex={-1} aria-hidden>
						{image ? <Image src={image} alt="" ratio="wide" borderRadius="medium" priority={false} /> : <LuNewspaper />}
					</Link>
					{newsletter && (
						<>
							<ul className="news-cats" aria-label="관심사">
								<li>{newsletter.category.name}</li>
							</ul>
							{/* 이 소식이 실린 뉴스레터가 나온 날 (위 날짜는 스크랩한 날) */}
							<p className="news-issued">{monthDay(newsletter.createdAt)} 뉴스레터</p>
							{/* 그 소식의 태그 (누르면 그 태그의 뉴스레터 목록) */}
							{tags.length > 0 && <Tags tags={tags} max={4} className="news-tags" linkable />}
						</>
					)}
				</div>
				{/* 오른쪽 상자: 이 뉴스레터에서 그날 스크랩한 문장들 */}
				<div className="news-summary">
					<ul className={`quotes ${showAll ? 'open' : ''}`}>
						{block.items.map((highlight, i) => (
							<li key={highlight.id} className={i >= QUOTES_SMALL ? 'extra' : undefined}>
								<HighlightItem
									highlight={highlight}
									index={i + 1}
									folder={folderNameOf(highlight.folderId)}
									focused={highlight.id === focused}
									dragged={!!selection.dragging?.includes(highlight.id)}
									selecting={selection.selecting}
									checked={selection.selected.has(highlight.id)}
									onToggle={() => selection.toggle(highlight.id)}
									onRemove={() => selection.remove(highlight)}
									onDragStart={(event) => selection.startDrag(event, highlight)}
									onDragEnd={selection.endDrag}
								/>
							</li>
						))}
					</ul>
					{/* 작은 화면에서만: 접어 둔 문장 펼치기 (큰 화면에선 다 보여 숨김) */}
					{block.items.length > QUOTES_SMALL && !open && (
						<button type="button" className="more-quotes" onClick={onOpen}>
							문장 {block.items.length - QUOTES_SMALL}개 더 보기
						</button>
					)}
				</div>
			</div>
		</article>
	);
}
