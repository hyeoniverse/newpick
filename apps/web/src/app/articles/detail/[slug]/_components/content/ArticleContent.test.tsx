import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import ArticleContent, { zoomableImages } from './ArticleContent';

vi.mock('@/components/common/article/SubscribeInduce', () => ({ default: () => null }));
vi.mock('./OpenGraphCard', () => ({ default: () => null }));
vi.mock('./HighlightLayer', () => ({ default: () => null }));
vi.mock('./FollowLayer', () => ({ default: () => null }));

const story = (alt: string) =>
	`<article class="story"><figure class="story-image"><img src="https://img.test/photo.jpg" alt="${alt}" loading="lazy"><figcaption>사진 <a href="https://news.test/1" target="_blank">한국일보</a></figcaption></figure><div class="body"><p>본문</p></div></article>`;

beforeAll(() => {
	// jsdom에는 <dialog> 열기 · 닫기가 없다
	HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute('open', '');
	};
	HTMLDialogElement.prototype.close = function () {
		this.removeAttribute('open');
		this.dispatchEvent(new Event('close'));
	};
});
afterEach(cleanup);

describe('zoomableImages', () => {
	it('소식 사진만 누를 수 있는 단추로 (이름: … 크게 보기)', () => {
		const html = zoomableImages(`${story('디지털세')}<p><img src="x.png" alt="다른 사진"></p>`);
		expect(html).toContain('alt="디지털세" role="button" tabindex="0" aria-label="디지털세 크게 보기"');
		expect(html).toContain('<img src="x.png" alt="다른 사진">');
	});
});

describe('ArticleContent: 사진 크게 보기', () => {
	it('소식 사진을 누르면 잘리지 않은 전체를 출처와 함께 띄우고, 닫으면 사라진다', () => {
		render(<ArticleContent content={story('디지털세')} />);
		fireEvent.click(screen.getByRole('button', { name: '디지털세 크게 보기' }));

		const dialog = screen.getByRole('dialog', { name: '사진 크게 보기: 디지털세' });
		expect(dialog.hasAttribute('open')).toBe(true);
		expect(dialog.querySelector('img')?.getAttribute('src')).toBe('https://img.test/photo.jpg');
		expect(screen.getByRole('link', { name: '사진 한국일보' }).getAttribute('href')).toBe('https://news.test/1');

		fireEvent.click(screen.getByRole('button', { name: '닫기' }));
		expect(dialog.hasAttribute('open')).toBe(false);
	});

	it('키보드(Enter)로도 연다', () => {
		render(<ArticleContent content={story('디지털세')} />);
		fireEvent.keyDown(screen.getByRole('button', { name: '디지털세 크게 보기' }), { key: 'Enter' });
		expect(screen.getByRole('dialog').hasAttribute('open')).toBe(true);
	});

	it('다시 그려져도 본문은 그대로 둔다 (예전에는 제목을 지나 스크롤만 해도 본문이 통째로 바뀌어 사진을 다시 받았다)', () => {
		const { rerender } = render(<ArticleContent content={story('디지털세')} />);
		const img = screen.getByRole('button', { name: '디지털세 크게 보기' });
		rerender(<ArticleContent content={story('디지털세')} className="again" />);
		expect(img.isConnected).toBe(true);
	});
});
