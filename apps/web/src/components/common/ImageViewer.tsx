'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { IconButton } from '@/components/common/icons/IconButton';

export interface ViewerImage {
	src: string;
	alt: string;
	/** 사진 아래 출처 (본문 figcaption 그대로: '사진 한국일보' + 원문 링크) */
	caption?: { text: string; href?: string };
}

/**
 * 사진 크게 보기 (공통, 기사 상세에서 시작). 본문 사진은 틀(16:9)에 맞춰 잘려 보이므로, 누르면 잘리지 않은 전체를 띄운다.
 * 바탕은 테마와 상관없이 검정 반투명 + 뒤 화면 흐림. 닫기는 공통 아이콘 단추
 * <dialog showModal()>: top layer라 머리글 · 막대보다 위, 뒤 화면은 비활성, Esc로 닫힘(브라우저 기본).
 * 바깥 · 사진을 눌러도 닫는다. 출처 링크는 눌러도 닫지 않는다
 */
export default function ImageViewer({ image, onClose }: { image: ViewerImage | null; onClose: () => void }) {
	const ref = useRef<HTMLDialogElement>(null);
	// body에 띄운다: 부르는 곳(본문)의 CSS(img 폭 등)가 뷰어 안까지 닿지 않게
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	// 닫으면 연 곳(누른 사진)으로 초점을 돌려놓는다 (키보드로 읽던 자리를 잃지 않게)
	const opener = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (image && !dialog.open) {
			opener.current = document.activeElement as HTMLElement | null;
			dialog.showModal();
		}
		if (!image && dialog.open) dialog.close();
	}, [image, mounted]);

	const close = () => ref.current?.close();

	if (!mounted) return null;
	return createPortal(
		<dialog
			ref={ref}
			className="np-image-viewer m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-black/75 p-0 backdrop-blur-md backdrop:bg-transparent"
			aria-label={image ? `사진 크게 보기: ${image.alt}` : undefined}
			onClose={() => {
				onClose();
				opener.current?.focus({ preventScroll: true });
			}}
			onClick={(e) => {
				const target = e.target as HTMLElement;
				if (target === e.currentTarget || target.tagName === 'IMG' || target.tagName === 'FIGURE') close();
			}}
		>
			{image && (
				<figure className="m-0 flex h-full w-full flex-col items-center justify-center gap-3 p-4 pt-14">
					{/* 본문에서 이미 받은 같은 주소를 그대로 (next/image면 사진 최적화를 거쳐 한 번 더 받는다) */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={image.src}
						alt={image.alt}
						className="block h-auto max-h-[calc(100dvh-7rem)] w-auto max-w-full cursor-zoom-out rounded-[8px] object-contain shadow-lg"
					/>
					{image.caption && (
						<figcaption className="text-small text-white/80">
							{image.caption.href ? (
								<a
									href={image.caption.href}
									target="_blank"
									rel="noopener noreferrer"
									className="text-inherit underline decoration-1 underline-offset-2"
								>
									{image.caption.text}
								</a>
							) : (
								image.caption.text
							)}
						</figcaption>
					)}
				</figure>
			)}
			<IconButton
				onClick={close}
				aria-label="닫기"
				className="absolute top-3 right-3 border border-solid border-white/70 text-white hover:bg-white/15 [&_svg]:size-5 [&_svg]:text-white"
			>
				<LuX aria-hidden />
			</IconButton>
		</dialog>,
		document.body,
	);
}
