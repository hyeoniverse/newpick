import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { CATEGORIES } from '@/constants/categories';
import { fetchEditionPreview } from '@/api/edition';
import { useOpenSubscribe } from '@/hooks/useOpenSubscribe';

import styled from 'styled-components';
import { LuCircleAlert, LuMailOpen } from 'react-icons/lu';
import Button from '@/components/common/Button';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Skeleton from '@/components/common/loader/Skeleton';

const INTERESTS = CATEGORIES.slice(1);

/**
 * 체험하기 = 내 뉴스레터 미리보기 (#54, #55).
 * 고른 분야로 엮은 구독 메일을 실제로 보내는 HTML 그대로 보여 준다.
 * 최신 발행본과 그날 편집본만 쓰고 새로 만들지 않는다 (Claude 호출 없음, 비용 0).
 * '이 구성으로 구독하기'는 고른 분야가 미리 선택된 구독 시트를 연다
 */
export default function Trial() {
	const [selected, setSelected] = useState<string[]>(['IT']);
	const openSubscribe = useOpenSubscribe();

	// 고른 순서와 상관없이 같은 조합이면 같은 요청
	const ids = INTERESTS.filter((c) => selected.includes(c.name)).map((c) => c.id);
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ['edition-preview', ids],
		queryFn: () => fetchEditionPreview(ids),
		enabled: ids.length > 0,
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});

	const toggle = (name: string) =>
		setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
	const isAll = selected.length === INTERESTS.length;

	return (
		<StyledTrial>
			<div className="header">
				<Title as="h2" size="small" weight="bold">
					내 뉴스레터 미리보기
				</Title>
				<Text size="small" color="subText">
					관심 분야를 고르면, 그 분야로 엮어 매일 아침 보내는 메일을 오늘 발행본으로 보여 드려요.
				</Text>
				<div className="chips" role="group" aria-label="관심 분야">
					<button
						type="button"
						className={isAll ? 'chip selected' : 'chip'}
						aria-pressed={isAll}
						onClick={() => setSelected(isAll ? [] : INTERESTS.map((c) => c.name))}
					>
						전체
					</button>
					{INTERESTS.map(({ name }) => (
						<button
							key={name}
							type="button"
							className={selected.includes(name) ? 'chip selected' : 'chip'}
							aria-pressed={selected.includes(name)}
							onClick={() => toggle(name)}
						>
							{name}
						</button>
					))}
				</div>
			</div>

			<StyledMail aria-live="polite" aria-busy={isLoading}>
				{!ids.length ? (
					<div className="info">
						<span className="badge">
							<LuMailOpen />
						</span>
						<Text size="medium" weight="semiBold">
							관심 분야를 하나 이상 골라 주세요
						</Text>
					</div>
				) : isLoading ? (
					<Skeleton />
				) : isError ? (
					<div className="info">
						<span className="badge error">
							<LuCircleAlert />
						</span>
						<Text size="medium" weight="semiBold">
							뉴스레터를 불러오지 못했어요
						</Text>
						<Button scheme="outline" size="small" onClick={() => refetch()}>
							다시 불러오기
						</Button>
					</div>
				) : !data ? (
					<div className="info">
						<span className="badge">
							<LuMailOpen />
						</span>
						<Text size="medium" weight="semiBold">
							아직 발행된 뉴스레터가 없어요
						</Text>
						<Text size="small" color="subText">
							뉴스레터는 매일 아침 8시 30분쯤 발행돼요.
						</Text>
					</div>
				) : (
					<article className="mail">
						<header className="mail-head">
							<span className="avatar" aria-hidden>
								NP
							</span>
							<div>
								<p className="from">뉴픽 NewPick</p>
								<h3 className="subject">{data.subject}</h3>
							</div>
						</header>
						{/* 실제 메일 HTML. 스크립트는 막고, 링크는 새 탭으로 연다 */}
						<iframe
							className="mail-body"
							title="구독 메일 미리보기"
							srcDoc={data.html}
							sandbox="allow-popups allow-popups-to-escape-sandbox"
						/>
					</article>
				)}
			</StyledMail>

			<Button
				size="medium"
				scheme="primary"
				className="subscribe"
				disabled={!selected.length}
				onClick={() => openSubscribe(isAll ? CATEGORIES.map((c) => c.name) : selected)}
			>
				{selected.length
					? `이 구성으로 구독하기 (${isAll ? '전체' : `${selected.length}개 분야`})`
					: '분야를 골라 주세요'}
			</Button>
		</StyledTrial>
	);
}

const StyledTrial = styled.div`
	/* 넓은 시트(large) 안을 채운다. 시트 최대 높이 85vh에서 위아래 여백을 뺀 만큼 */
	width: 100%;
	height: min(46rem, calc(85vh - 4rem));
	display: flex;
	flex-direction: column;
	gap: 1.25rem;

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.chip {
		padding: 0.375rem 0.875rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.borderRadius.capsule};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.text};
		cursor: pointer;

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};
		}

		&.selected {
			border-color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.background};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}
	}

	.subscribe {
		flex-shrink: 0;
		width: 100%;
		height: 3rem;
		border-radius: ${({ theme }) => theme.borderRadius.flat};
	}
`;

/** 받은편지함에서 연 메일 모양. 시트 폭이 메일 폭(600px)에 맞춰져 있어 본문(iframe)이 꽉 찬다 */
const StyledMail = styled.div`
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;

	.info {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.25rem;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
		background: ${({ theme }) => theme.color.surface};
		text-align: center;
		word-break: keep-all;

		.badge {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 3.5rem;
			height: 3.5rem;
			margin-bottom: 0.5rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};

			svg {
				width: 1.75rem;
				height: 1.75rem;
			}

			&.error {
				color: ${({ theme }) => theme.color.error};
			}
		}
	}

	.mail {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* 받은편지함의 보낸 사람·제목 줄 */
	.mail-head {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;

		.avatar {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 2.5rem;
			height: 2.5rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			background: ${({ theme }) => theme.color.primary};
			color: #ffffff;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}

		.from {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}

		.subject {
			margin: 0.125rem 0 0;
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			line-height: 1.4;
			color: ${({ theme }) => theme.color.text};
			word-break: keep-all;
		}
	}

	/* 메일 앱처럼 본문은 라이트 그대로 (메일 HTML이 배경색을 갖고 있다) */
	.mail-body {
		flex: 1;
		width: 100%;
		min-height: 0;
		border: none;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
	}
`;
