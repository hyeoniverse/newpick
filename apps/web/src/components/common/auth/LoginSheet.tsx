'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { IoLogoGoogle } from 'react-icons/io';
import { LuLogIn } from 'react-icons/lu';
import { useState } from 'react';
import { loginUser } from '@/api/auth';
import { useToast } from '@/hooks/useToast';

import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';

interface Props {
	/** 로그인이 필요한 이유 (예: 구독하려면). 없으면 헤더의 로그인 */
	reason?: string;
}

const LINK = 'text-text underline underline-offset-[0.2em] hover:text-primary focus-visible:text-primary';

/**
 * 로그인 창 (#66). 구글로 넘어가기 전에 이용약관·개인정보 처리방침 안내를 보여 준다.
 * 이용약관은 "구글 계정으로 로그인해 회원이 되면 이용계약이 성립"한다고 적었으므로, 로그인 버튼 바로 아래에 둔다
 */
export default function LoginSheet({ reason }: Props) {
	const { showToast } = useToast();
	const [waiting, setWaiting] = useState(false);

	const login = async () => {
		setWaiting(true);
		const result = await loginUser();
		// iframe 안 팝업 로그인의 결과. 성공하면 새로 고쳐 로그인 상태로 (쿠키는 같은 사이트라 그대로 쓰인다)
		if (result === 'ok') return window.location.reload();
		if (result === 'blocked')
			showToast('팝업이 막혀 있습니다. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주십시오.', 'error');
		if (result === 'failed') showToast('로그인하지 못했습니다. 다시 시도해 주십시오.', 'error');
		setWaiting(false);
	};

	return (
		<div className="flex w-full flex-col items-center gap-2 pt-2 text-center">
			<span className="badge mb-2 flex size-[3.25rem] items-center justify-center rounded-full bg-tertiary text-primary [&_svg]:size-[1.625rem]">
				<LuLogIn />
			</span>
			<Title size="extraSmall" weight="bold">
				{reason ?? '뉴픽 로그인'}
			</Title>
			<Text size="small" color="subText">
				구글 계정으로 바로 시작할 수 있습니다.
			</Text>

			<Button
				className="google mt-4"
				scheme="primary"
				size="medium"
				icon={<IoLogoGoogle />}
				iconPosition="left"
				onClick={login}
				style={{ '--btn-width': '100%' } as React.CSSProperties}
			>
				{/* 팝업을 닫았으면 다시 눌러 다시 연다 (구글을 거치면 팝업이 닫혔는지 알 수 없어 버튼을 막지 않는다) */}
				{waiting ? '팝업에서 로그인 중 · 다시 열기' : '구글로 계속하기'}
			</Button>

			<p className="notice mt-2 text-extra-small leading-[1.6] text-sub-text [word-break:keep-all]">
				로그인 시 뉴픽의 {/* 로그인 창을 닫지 않고 읽을 수 있게 새 탭으로 */}
				<Link href={ROUTES.terms} target="_blank" className={LINK}>
					이용약관
				</Link>{' '}
				및{' '}
				<Link href={ROUTES.privacy} target="_blank" className={LINK}>
					개인정보 처리방침
				</Link>
				에 동의한 것으로 간주합니다.
			</p>
		</div>
	);
}
