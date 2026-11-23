'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import Button from '@/components/common/Button';

export interface ViewerImage {
	src: string;
	alt: string;
	/** 사진 아래 출처 (본문 figcaption 그대로: label '사진' + 언론사 이름 · 원문 링크). 언론사 이름은 강조색 */
	caption?: { label?: string; source: string; href?: string };
	/** 누른 사진: 이 자리 · 모양(틀에 맞춰 잘린 것)에서 크게 펼쳐지고, 닫으면 여기로 돌아간다. 없으면 바로 뜬다 */
	from?: HTMLImageElement;
}

const MORPH_MS = 320;
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/**
 * 누른 사진(틀에 맞춰 잘린 썸네일) 자리 · 모양을 큰 사진 기준의 transform · clip-path로.
 * 썸네일은 사진을 cover로 채운 것이라, 큰 사진을 같은 배율로 줄여 가운데를 썸네일 크기만큼 잘라 낸 모양과 같다
 */
function morphFrom(thumb: HTMLImageElement, big: HTMLImageElement) {
	const from = thumb.getBoundingClientRect();
	const to = big.getBoundingClientRect();
	if (!from.width || !to.width) return null;
	const scale = Math.max(from.width / to.width, from.height / to.height);
	// 큰 사진 좌표에서 잘라 낼 위아래 · 양옆 (cover: 넘치는 쪽만 잘린다)
	const insetX = (to.width - from.width / scale) / 2;
	const insetY = (to.height - from.height / scale) / 2;
	const radius = (parseFloat(getComputedStyle(thumb).borderRadius) || 0) / scale;
	const dx = from.left + from.width / 2 - (to.left + to.width / 2);
	const dy = from.top + from.height / 2 - (to.top + to.height / 2);
	return {
		transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
		clipPath: `inset(${insetY}px ${insetX}px round ${radius}px)`,
	};
}

/**
 * 화면에 꽉 차게(위아래 8rem 여백 안에서 비율 그대로). 작은 사진(원본 폭 500px 등)은 본문에 보이던 것보다 작게 떠서 늘린다
 */
function fitScreen(big: HTMLImageElement) {
	if (!big.naturalWidth || !big.naturalHeight) return;
	big.style.width = `min(100%, calc((100dvh - 8rem) * ${big.naturalWidth / big.naturalHeight}))`;
}

/** 움직임 줄이기 설정이거나 움직임을 못 그리는 곳(테스트 환경 등)이면 바로 열고 닫는다 */
const reducedMotion = () =>
	typeof Element.prototype.animate !== 'function' ||
	!window.matchMedia ||
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 사진 크게 보기 (공통, 기사 상세에서 시작). 본문 사진은 틀(16:9)에 맞춰 잘려 보이므로, 누르면 잘리지 않은 전체를 띄운다.
 * - 누른 사진이 제자리에서 큰 사진으로 펼쳐지고(잘린 부분이 드러나며), 닫으면 제자리로 돌아간다 (움직임 줄이기면 바로)
 * - 바탕은 테마와 상관없이 검정 반투명 + 뒤 화면 흐림. 닫기는 공통 Button (outline)
 * - <dialog showModal()>: top layer라 머리글 · 막대보다 위, 뒤 화면은 비활성. Esc · 바깥 · 사진을 누르면 닫는다 (출처 링크는 제외)
 */
export default function ImageViewer({ image, onClose }: { image: ViewerImage | null; onClose: () => void }) {
	const ref = useRef<HTMLDialogElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const scrimRef = useRef<HTMLDivElement>(null);
	const chromeRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef<HTMLDivElement>(null);
	// body에 띄운다: 부르는 곳(본문)의 CSS(img 폭 등)가 뷰어 안까지 닿지 않게
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	// 닫으면 연 곳(누른 사진)으로 초점을 돌려놓는다 (키보드로 읽던 자리를 잃지 않게)
	const opener = useRef<HTMLElement | null>(null);
	const closing = useRef(false);

	/** 바탕 · 단추 · 출처를 서서히 (방향: 1 나타남, -1 사라짐) */
	const fade = (direction: 1 | -1) => {
		const keyframes = direction === 1 ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
		const options = { duration: MORPH_MS, easing: EASE, fill: 'forwards' as const };
		return [scrimRef, chromeRef, closeRef].map((r) => r.current?.animate(keyframes, options));
	};

	// 열기: 큰 사진을 그린 뒤(크기를 알아야 해서) 누른 사진 자리에서 펼친다
	useLayoutEffect(() => {
		const dialog = ref.current;
		if (!dialog || !image || dialog.open) return;
		opener.current = document.activeElement as HTMLElement | null;
		closing.current = false;
		dialog.showModal();
		const big = imgRef.current;
		if (!big) return;
		const motion = !reducedMotion();
		if (motion) fade(1);
		const thumb = image.from;
		const show = () => {
			fitScreen(big);
			if (!motion || !thumb) return;
			const start = morphFrom(thumb, big);
			if (!start) return;
			big.animate([start, { transform: 'none', clipPath: 'inset(0px round 8px)' }], {
				duration: MORPH_MS,
				easing: EASE,
			});
		};
		// 본문에서 이미 받은 사진이라 대개 바로 그려진다. 아니면 받은 뒤에
		if (big.complete && big.naturalWidth) show();
		else big.addEventListener('load', show, { once: true });
	}, [image, mounted]);

	useEffect(() => {
		if (!image && ref.current?.open) ref.current.close();
	}, [image]);

	/** 닫기: 큰 사진을 누른 사진 자리로 되돌린 뒤 닫는다 */
	const close = () => {
		const dialog = ref.current;
		if (!dialog?.open || closing.current) return;
		closing.current = true;
		const big = imgRef.current;
		const thumb = image?.from;
		const end = big && thumb?.isConnected && !reducedMotion() ? morphFrom(thumb, big) : null;
		if (reducedMotion()) return dialog.close();
		fade(-1);
		const animation = big?.animate(
			end ? [{ transform: 'none', clipPath: 'inset(0px round 8px)' }, end] : [{ opacity: 1 }, { opacity: 0 }],
			{ duration: MORPH_MS, easing: EASE, fill: 'forwards' },
		);
		if (animation) animation.onfinish = () => dialog.close();
		else dialog.close();
	};

	if (!mounted) return null;
	return createPortal(
		<dialog
			ref={ref}
			// 바탕이 늘 검정이라 안쪽(강조색 · 단추)은 다크 테마 색으로 (라이트의 진한 보라는 검정에 묻힌다)
			data-theme="dark"
			className="np-image-viewer m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-transparent"
			aria-label={image ? `사진 크게 보기: ${image.alt}` : undefined}
			// Esc: 브라우저가 바로 닫지 않게 하고 되돌아가는 움직임 뒤에 닫는다
			onCancel={(e) => {
				e.preventDefault();
				close();
			}}
			onClose={() => {
				onClose();
				opener.current?.focus({ preventScroll: true });
			}}
			onClick={(e) => {
				const target = e.target as HTMLElement;
				if (target.closest('a, button')) return;
				close();
			}}
		>
			<div ref={scrimRef} className="absolute inset-0 bg-black/75 backdrop-blur-md" aria-hidden />
			{image && (
				<figure className="relative m-0 flex h-full w-full flex-col items-center justify-center gap-3 p-4 pt-16">
					{/* 본문에서 이미 받은 같은 주소를 그대로 (next/image면 사진 최적화를 거쳐 한 번 더 받는다) */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						ref={imgRef}
						src={image.src}
						alt={image.alt}
						className="block h-auto max-h-[calc(100dvh-8rem)] w-auto max-w-full cursor-zoom-out rounded-[8px] object-contain shadow-lg will-change-transform"
					/>
					<div ref={chromeRef}>
						{image.caption && (
							<figcaption className="text-small text-white/80">
								{image.caption.label && <>{image.caption.label} </>}
								{image.caption.href ? (
									<a
										href={image.caption.href}
										target="_blank"
										rel="noopener noreferrer"
										className="font-semi-bold text-primary underline decoration-1 underline-offset-2"
									>
										{image.caption.source}
									</a>
								) : (
									<span className="font-semi-bold text-primary">{image.caption.source}</span>
								)}
							</figcaption>
						)}
					</div>
				</figure>
			)}
			<div ref={closeRef} className="absolute top-3 right-3">
				<Button
					scheme="outline"
					size="small"
					// 정사각형: 글자 없는 아이콘 단추라 양옆 여백을 빼고 가로 · 세로를 같게 (36px)
					className="size-9 justify-center px-0"
					icon={<LuX aria-hidden />}
					onClick={close}
					aria-label="닫기"
				/>
			</div>
		</dialog>,
		document.body,
	);
}
