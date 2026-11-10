'use client';

import { NavigationItem as INavigationItem } from '@/types/navigation';
import { useTabStore } from '@/stores/useTabStore';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { cx } from '@/styles/tw';

interface Props {
	tabs: INavigationItem[];
}

/** 주소의 ?tab=을 읽으므로 Suspense 안에서 (정적 페이지에서도 쓰이게) */
export default function TabNavigation(props: Props) {
	return (
		<Suspense fallback={null}>
			<Tabs {...props} />
		</Suspense>
	);
}

function Tabs({ tabs }: Props) {
	const { activeTab, setActiveTab } = useTabStore();
	const fromUrl = useSearchParams().get('tab');

	// 주소의 ?tab=(예: 수신 거부 화면의 '마이페이지에서 해지' → ?tab=settings, 스크랩 알림의 '모아 보기' → ?tab=highlights)을 따르고,
	// 없으면 첫 탭 (#17). window.location이 아니라 라우터 값으로 읽는다: 다른 화면에서 링크로 올 때는
	// 이 효과가 도는 순간 주소창이 아직 바뀌지 않아 첫 탭으로 떨어졌다
	useEffect(() => {
		setActiveTab(tabs.some((tab) => tab.link === fromUrl) ? fromUrl! : tabs[0].link);
	}, [fromUrl, setActiveTab, tabs]);

	// 고른 탭을 주소에도 남겨, 새로 고침 · 뒤로 와도 같은 탭 (기록은 쌓지 않음). 첫 탭이면 주소를 깨끗하게(?tab= 없이)
	useEffect(() => {
		const url = new URL(window.location.href);
		const wanted = activeTab === tabs[0].link ? null : activeTab;
		if (url.searchParams.get('tab') === wanted) return;
		if (wanted) url.searchParams.set('tab', wanted);
		else url.searchParams.delete('tab');
		window.history.replaceState(window.history.state, '', url);
	}, [activeTab, tabs]);

	return (
		<div
			role="tablist"
			className="mt-[60px] mb-10 flex h-full flex-row justify-start border-0 border-b border-solid border-border"
		>
			{tabs.map(({ id, title, link }) => (
				<button
					key={id}
					type="button"
					role="tab"
					aria-selected={activeTab === link}
					className={cx(
						'-mb-px w-1/3 cursor-pointer border-0 border-b border-solid border-transparent bg-transparent px-0 py-4 text-small [transition:border-bottom_0.2s_ease,color_0.2s_ease] hover:text-text',
						activeTab === link
							? 'active font-regular text-text shadow-[inset_0_-2px_0_var(--color-text)]'
							: 'text-light-grey',
					)}
					onClick={() => setActiveTab(link)}
				>
					<span className="flex h-full items-center justify-center whitespace-nowrap">{title}</span>
				</button>
			))}
		</div>
	);
}
