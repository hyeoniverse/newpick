'use client';

import styled from 'styled-components';
import { LuCheck, LuPlus } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import { useTagFollows } from '@/hooks/useTagFollows';

interface Props {
	tag: string;
	className?: string;
}

/** 태그 팔로우 단추 (#123): 팔로우하면 맞춤 메일에서 이 태그의 소식을 앞에 보낸다. 로그인하지 않았으면 로그인 창 */
export default function TagFollowButton({ tag, className }: Props) {
	const { user } = useAuth();
	const openLogin = useOpenLogin();
	const { isFollowing, follow, unfollow } = useTagFollows();
	const on = !!user && isFollowing(tag);
	const busy = follow.isPending || unfollow.isPending;

	return (
		<StyledTagFollowButton
			type="button"
			className={[className, on ? 'on' : ''].filter(Boolean).join(' ')}
			aria-pressed={on}
			disabled={busy}
			onClick={() => {
				if (!user) {
					openLogin('태그를 팔로우하려면 로그인해 주세요');
					return;
				}
				if (on) unfollow.mutate(tag);
				else follow.mutate(tag);
			}}
		>
			{on ? <LuCheck aria-hidden /> : <LuPlus aria-hidden />}
			{on ? `#${tag} 팔로우 중` : `#${tag} 팔로우`}
		</StyledTagFollowButton>
	);
}

const StyledTagFollowButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	margin: 0;
	padding: 0.25rem 0.625rem;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.chip};
	background: ${({ theme }) => theme.color.background};
	font-size: ${({ theme }) => theme.fontSize.small};
	font-weight: ${({ theme }) => theme.fontWeight.medium};
	line-height: 1.25;
	color: ${({ theme }) => theme.color.subText};
	white-space: nowrap;
	cursor: pointer;
	transition:
		color 0.15s ease,
		border-color 0.15s ease;

	svg {
		display: block;
		flex-shrink: 0;
		width: 0.875rem;
		height: 0.875rem;
	}

	&:hover:not(:disabled),
	&.on {
		border-color: ${({ theme }) => theme.color.primary};
		color: ${({ theme }) => theme.color.primary};
	}

	&.on {
		background: ${({ theme }) => theme.color.tertiary};
	}

	&:disabled {
		cursor: progress;
		opacity: 0.6;
	}
`;
