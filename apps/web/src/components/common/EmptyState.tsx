'use client';

import Link from 'next/link';
import type { IconType } from 'react-icons';

import styled from 'styled-components';
import Button from '@/components/common/Button';

interface Props {
	icon: IconType;
	title: string;
	description?: string;
	/** 다음에 할 일. href면 이동, onClick이면 그 동작 */
	action?: { label: string; href?: string; onClick?: () => void };
	className?: string;
}

/**
 * 빈 화면 (#17): 북마크 없음, 구독 전 등. 오류 화면(ErrorState)과 같은 아이콘 · 제목 · 설명 · 버튼 차례를
 * 탭 안에 들어가는 크기로. 오류가 아니므로 색은 차분하게(테두리 원)
 */
export default function EmptyState({ icon: Icon, title, description, action, className }: Props) {
	return (
		<StyledEmptyState className={className}>
			<span className="badge" aria-hidden>
				<Icon />
			</span>
			<h2 className="title">{title}</h2>
			{description && <p className="description">{description}</p>}
			{action &&
				(action.href ? (
					<Link href={action.href} className="action">
						<Button as="span" scheme="primary" size="medium">
							{action.label}
						</Button>
					</Link>
				) : (
					<Button className="action" scheme="primary" size="medium" onClick={action.onClick}>
						{action.label}
					</Button>
				))}
		</StyledEmptyState>
	);
}

const StyledEmptyState = styled.section`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.625rem;
	width: 100%;
	max-width: 28rem;
	margin: 0 auto;
	padding: 4rem 0;
	text-align: center;
	word-break: keep-all;

	.badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		margin-bottom: 0.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.borderRadius.circle};
		color: ${({ theme }) => theme.color.subText};

		svg {
			width: 1.5rem;
			height: 1.5rem;
		}
	}

	.title {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		line-height: 1.4;
		color: ${({ theme }) => theme.color.text};
	}

	.description {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.subText};
		white-space: pre-line;
	}

	.action {
		margin-top: 1rem;

		> span,
		&button {
			min-width: 10rem;
			justify-content: center;
		}
	}
`;
