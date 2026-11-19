import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Image from '@/components/common/Image';
import { DEFAULT_IMAGES } from '@/constants/images';

const BROKEN = 'https://imgnews.pstatic.net/image/gone.jpg';
const STOCK = 'https://images.pexels.com/photos/1/a.jpeg?auto=compress&w=800&h=450';
// next/image는 주소를 /_next/image?url=… 로 바꾸므로 원래 주소가 들어 있는지로 본다
const srcOf = () => decodeURIComponent(screen.getByRole('img').getAttribute('src') ?? '');
const fail = () => fireEvent.error(screen.getByRole('img'));

afterEach(cleanup);

describe('Image', () => {
	it('못 불러오면(지워진 기사 사진 등) 기본 그림으로 바꾼다', () => {
		render(<Image src={BROKEN} alt="썸네일" />);
		expect(srcOf()).toContain(BROKEN);
		fail();
		expect(srcOf()).toContain(DEFAULT_IMAGES.MONO);
	});

	it('원래 사진 → 대신할 사진(키워드 사진) → 기본 그림, 기본 그림도 깨지면 더 바꾸지 않는다', () => {
		render(<Image src={BROKEN} alt="썸네일" fallback={STOCK} />);
		fail();
		expect(srcOf()).toBe(STOCK);
		fail();
		expect(srcOf()).toMatch(new RegExp(`${DEFAULT_IMAGES.MONO}$`));
		fail();
		expect(srcOf()).toMatch(new RegExp(`${DEFAULT_IMAGES.MONO}$`));
	});

	it('대신 보이는 사진은 사진 최적화(/_next/image)를 거치지 않는다 (최적화가 실패해도 보이게)', () => {
		render(<Image src={BROKEN} alt="썸네일" fallback={STOCK} />);
		expect(srcOf()).toContain('/_next/image');
		fail();
		expect(srcOf()).not.toContain('/_next/image');
		fail();
		expect(srcOf()).not.toContain('/_next/image');
	});

	it('원래 사진이 없으면(기본 그림을 넘김) 대신할 사진부터', () => {
		render(<Image src={DEFAULT_IMAGES.MONO} alt="썸네일" fallback={STOCK} />);
		expect(srcOf()).toBe(STOCK);
	});

	it('주소가 바뀌면 새 주소부터 다시 시도한다', () => {
		const { rerender } = render(<Image src={BROKEN} alt="썸네일" />);
		fail();
		rerender(<Image src="https://example.com/new.jpg" alt="썸네일" />);
		expect(srcOf()).toContain('https://example.com/new.jpg');
	});
});
