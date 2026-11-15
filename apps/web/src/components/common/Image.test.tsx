import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Image from '@/components/common/Image';
import { DEFAULT_IMAGES } from '@/constants/images';

const BROKEN = 'https://imgnews.pstatic.net/image/gone.jpg';
// next/image는 주소를 /_next/image?url=… 로 바꾸므로 원래 주소가 들어 있는지로 본다
const srcOf = () => decodeURIComponent(screen.getByRole('img').getAttribute('src') ?? '');

afterEach(cleanup);

describe('Image', () => {
	it('못 불러오면(지워진 기사 사진 등) 기본 그림으로 바꾼다', () => {
		render(<Image src={BROKEN} alt="썸네일" />);
		expect(srcOf()).toContain(BROKEN);
		fireEvent.error(screen.getByRole('img'));
		expect(srcOf()).toContain(DEFAULT_IMAGES.MONO);
	});

	it('기본 그림도 못 불러오면 더 바꾸지 않는다 (무한 반복 없음)', () => {
		render(<Image src={BROKEN} alt="썸네일" fallback="/img/x.jpg" />);
		fireEvent.error(screen.getByRole('img'));
		fireEvent.error(screen.getByRole('img'));
		expect(srcOf()).toContain('/img/x.jpg');
	});

	it('주소가 바뀌면 새 주소부터 다시 시도한다', () => {
		const { rerender } = render(<Image src={BROKEN} alt="썸네일" />);
		fireEvent.error(screen.getByRole('img'));
		rerender(<Image src="https://example.com/new.jpg" alt="썸네일" />);
		expect(srcOf()).toContain('https://example.com/new.jpg');
	});
});
