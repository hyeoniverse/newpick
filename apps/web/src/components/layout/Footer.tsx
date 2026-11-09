'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { cx } from '@/styles/tw';
import { GITHUB } from '@/constants/about';
import Logo from '@/components/common/Logo';
import Text from '@/components/common/Text';
import ExternalLink from '@/components/common/ExternalLink';
import { FaGithub } from 'react-icons/fa';

interface Props {
	/** 문의처 = 구독 메일 발송 주소. 없으면 숨긴다 */
	contactEmail?: string | null;
}

/* 바닥 메뉴 링크: 마우스를 올리면 강조색 (개인정보 처리방침은 이미 강조색이라 밑줄) */
const LINK = 'cursor-pointer hover:text-primary hover:no-underline';

const Footer = ({ contactEmail }: Props) => {
	return (
		<footer
			id="footer-el"
			className="mt-auto flex h-fit w-full flex-col items-center justify-end border-0 border-t border-solid border-border bg-surface py-12"
		>
			<div className="footer flex w-full max-w-[1024px] flex-col items-start justify-end gap-4 text-sub-text">
				<Logo logoType="footer-logo" />
				<div className="footer-menu flex flex-row flex-wrap items-center justify-start gap-4 text-extra-small">
					{contactEmail && (
						<>
							<Text size="extraSmall">서비스 이용 문의</Text>
							<a className={cx('footer-item email', LINK)} href={`mailto:${contactEmail}`}>
								{contactEmail}
							</a>
						</>
					)}
					<Link className={cx('footer-item', LINK)} href={ROUTES.terms}>
						이용약관
					</Link>
					{/* 개인정보 처리방침은 다른 항목과 색으로 구분해 쉽게 찾게 한다 (개인정보 처리방침 작성지침) */}
					<Link className="footer-item privacy cursor-pointer text-primary hover:underline" href={ROUTES.privacy}>
						개인정보 처리방침
					</Link>
					<ExternalLink className={cx('footer-item', LINK)} href={GITHUB.REPO} showIcon={false}>
						<FaGithub aria-hidden />
						<span className="sr-only">GitHub 저장소</span>
					</ExternalLink>
				</div>
				<Text size="extraSmall" color="subText">
					© 2025–{new Date().getFullYear()} NewPick. All Rights Reserved.
				</Text>
			</div>
		</footer>
	);
};

export default Footer;
