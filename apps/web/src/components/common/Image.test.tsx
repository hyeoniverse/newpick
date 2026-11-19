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
		expect(srcOf()).toContain(STOCK);
		fail();
		expect(srcOf()).toMatch(new RegExp(`${DEFAULT_IMAGES.MONO}$`));
		fail();
		expect(srcOf()).toMatch(new RegExp(`${DEFAULT_IMAGES.MONO}$`));
	});

	it('키워드 사진도 사진 줄이기를 거치고(제3자 쿠키 없게), 기본 그림만 거치지 않는다 (줄이기가 안 될 때도 보이게)', () => {
		render(<Image src={BROKEN} alt="썸네일" fallback={STOCK} />);
		expect(srcOf()).toContain('/_next/image');
		fail();
		expect(srcOf()).toContain('/_next/image');
		expect(srcOf()).toContain(STOCK);
		fail();
		expect(srcOf()).not.toContain('/_next/image');
		expect(srcOf()).toMatch(new RegExp(`${DEFAULT_IMAGES.MONO}$`));
	});

	it('원래 사진이 없으면(기본 그림을 넘김) 대신할 사진부터', () => {
		render(<Image src={DEFAULT_IMAGES.MONO} alt="썸네일" fallback={STOCK} />);
		expect(srcOf()).toContain(STOCK);
	});

	it('주소가 바뀌면 새 주소부터 다시 시도한다', () => {
		const { rerender } = render(<Image src={BROKEN} alt="썸네일" />);
		fail();
		rerender(<Image src="https://example.com/new.jpg" alt="썸네일" />);
		expect(srcOf()).toContain('https://example.com/new.jpg');
	});

	it('fallbackNode를 주면 원래 사진이 깨질 때 그것을 그린다 (프로필 → 사람 모양)', () => {
		render(<Image src={BROKEN} alt="프로필" fallbackNode={<span data-testid="avatar" />} />);
		expect(screen.queryByTestId('avatar')).toBeNull();
		fail();
		expect(screen.getByTestId('avatar')).toBeTruthy();
		expect(screen.queryByRole('img')).toBeNull();
	});

	it('기본 그림은 세로로 긴 칸(tall)에서만 잘리지 않게 전체를 넣는다 (contain), 넓은 칸은 그대로 채움', () => {
		render(<Image src={BROKEN} alt="썸네일" ratio="tall" />);
		expect(screen.getByRole('img').style.objectFit).toBe('cover');
		fail();
		expect(screen.getByRole('img').style.objectFit).toBe('contain');
		cleanup();
		render(<Image src={BROKEN} alt="썸네일" ratio="wide" />);
		fail();
		expect(screen.getByRole('img').style.objectFit).toBe('cover');
	});
});
