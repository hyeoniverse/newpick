'use client';

import Link from 'next/link';
import { IoLogoGoogle } from 'react-icons/io';
import { LuLogIn } from 'react-icons/lu';
import { loginUser } from '@/api/auth';

import styled from 'styled-components';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';

interface Props {
	/** 로그인이 필요한 이유 (예: 구독하려면). 없으면 헤더의 로그인 */
	reason?: string;
}

/**
 * 로그인 창 (#66). 구글로 넘어가기 전에 이용약관·개인정보 처리방침 안내를 보여 준다.
 * 이용약관은 "구글 계정으로 로그인해 회원이 되면 이용계약이 성립"한다고 적었으므로, 로그인 버튼 바로 아래에 둔다
 */
export default function LoginSheet({ reason }: Props) {
	return (
		<StyledLoginSheet>
			<span className="badge">
				<LuLogIn />
			</span>
			<Title size="extraSmall" weight="bold">
				{reason ?? '뉴픽 로그인'}
			</Title>
			<Text size="small" color="subText">
				구글 계정으로 바로 시작할 수 있어요.
			</Text>

			<Button
				className="google"
				scheme="primary"
				size="medium"
				icon={<IoLogoGoogle />}
				iconPosition="left"
				onClick={loginUser}
			>
				구글로 계속하기
			</Button>

			<p className="notice">
				로그인하면 뉴픽의 {/* 로그인 창을 닫지 않고 읽을 수 있게 새 탭으로 */}
				<Link href="/terms" target="_blank">
					이용약관
				</Link>
				과{' '}
				<Link href="/privacy" target="_blank">
					개인정보 처리방침
				</Link>
				에 동의하는 것으로 봅니다.
			</p>
		</StyledLoginSheet>
	);
}

const StyledLoginSheet = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	padding-top: 0.5rem;
	text-align: center;

	.badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.25rem;
		height: 3.25rem;
		margin-bottom: 0.5rem;
		border-radius: ${({ theme }) => theme.borderRadius.circle};
		background: ${({ theme }) => theme.color.tertiary};
		color: ${({ theme }) => theme.color.primary};

		svg {
			width: 1.625rem;
			height: 1.625rem;
		}
	}

	.google {
		width: 100%;
		margin-top: 1rem;
		justify-content: center;
	}

	.notice {
		margin-top: 0.5rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;

		a {
			color: ${({ theme }) => theme.color.text};
			text-decoration: underline;
			text-underline-offset: 0.2em;

			&:hover,
			&:focus-visible {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}
`;
