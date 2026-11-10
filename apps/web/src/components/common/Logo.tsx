import Link from 'next/link';
import { PCLogo, MoLogo } from '@/components/common/icons/LogoSVG';

interface Props {
	logoType?: 'footer-logo'; // 허용 가능한 값 명시
}

/** 뉴픽 로고. 태블릿 이하는 정사각 로고, 바닥글은 회색으로 크게 */
const Logo = ({ logoType }: Props) => {
	const footer = logoType === 'footer-logo';
	return (
		<Link href="/" aria-label="뉴픽 홈">
			<div className="flex cursor-pointer justify-center text-large font-bold text-primary" aria-hidden>
				<PCLogo
					className={
						footer ? 'footer-desktop-logo h-8 text-medium-grey tablet:hidden' : 'desktop-logo h-[22px] tablet:hidden'
					}
				/>
				<MoLogo
					className={
						footer
							? 'footer-mobile-logo hidden h-12 text-medium-grey tablet:block'
							: 'mobile-logo hidden h-8 tablet:block'
					}
				/>
			</div>
		</Link>
	);
};

export default Logo;
