'use client';

import { useOpenSubscribe } from '@/hooks/useOpenSubscribe';
import Button from '@/components/common/Button';
import { cx } from '@/styles/tw';

interface Props {
	className?: string;
}

/** 디테일 본문 아래 구독 권유 띠. 태블릿 이하는 글 · 단추를 세로로 */
function SubscribeInduce({ className }: Props) {
	// 마이페이지로 보내지 않고 이 자리에서 구독 (#52)
	const openSubscribe = useOpenSubscribe();

	return (
		<div
			className={cx(
				'flex flex-row items-center gap-8 rounded-surface bg-tertiary px-16 py-8 tablet:flex-col tablet:gap-4 tablet:p-8 tablet:text-center',
				className,
			)}
			data-track-section="subscribe-cta"
		>
			<p className="w-full bg-[linear-gradient(to_right_top,#0c0042,#2d11b1,#5537dd,#0e004d)] [-webkit-background-clip:text] bg-clip-text text-extra-large font-semi-bold text-transparent [word-break:keep-all] dark:bg-[linear-gradient(to_right_top,#3b1d91,#5b40e0,#7761ff,#a28eff)]">
				뉴픽 뉴스레터, 메일로 받아 보기
			</p>
			{/* 단추 크기는 Button의 변수로 (Button 안의 크기 규칙이 이 변수를 읽는다) */}
			<Button
				scheme="primary"
				size="medium"
				onClick={() => openSubscribe()}
				style={
					{
						'--btn-width': '10rem',
						'--btn-height': '2.875rem',
						'--btn-font-size': 'var(--np-font-size-medium)',
					} as React.CSSProperties
				}
			>
				구독하기
			</Button>
		</div>
	);
}

export default SubscribeInduce;
