'use client';

import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import styles from '@/app/(protected)/protected.module.css';
import AdminGate from '@/components/common/auth/AdminGate';
import Title from '@/components/common/Title';
import BackBar from '@/components/common/BackBar';
import { PeriodPicker, PeriodTitle, useAdminQuery } from './period';

interface Props {
	title: string;
	/** 기간 이름 옆 요약 (예: '12편') */
	summary?: React.ReactNode;
	/** 기간 아래 줄: 이 화면만의 거르기 */
	filters?: React.ReactNode;
	/** false면 기간 고르기를 빼고 제목만 (태그 관리처럼 기간이 없는 화면) */
	period?: boolean;
	children: React.ReactNode;
}

/**
 * 관리자 상세 화면 틀 (#21): ← 대시보드 · 제목 · 기간(주소에 남음) · 거르기 · 본문.
 * 대시보드는 요약만, 전체는 여기서 쪽 단위로
 */
export default function AdminSubPage({ title, summary, filters, period = true, children }: Props) {
	const router = useRouter();
	const { periodQuery } = useAdminQuery();
	return (
		<AdminGate>
			<div className={styles.page}>
				<StyledSubPage>
					{/* 세 묶음: 머리(뒤로 막대) / 조건(제목 · 기간 한 줄, 거르기) / 결과(건수 · 표 · 쪽) */}
					{/* 기사 상세의 '목록으로'와 같은 막대: 스크롤하면 위에 붙고, 내릴 땐 화살표만.
					    화면 끝까지 따라오도록 묶음 밖(맨 바깥 틀의 바로 아래)에 둔다 */}
					<BackBar text="관리자 대시보드" onClick={() => router.push(`/admin${periodQuery}`)} />
					<div className="conditions">
						{/* 제목 · 기간을 한 줄에: 왼쪽 '수집한 기사 | 기간 ( 날짜 )', 오른쪽 끝 오늘 · 어제 · … */}
						<div className="head">
							<div className="head-left">
								<Title size="extraSmall" weight="bold" className="page-title">
									{title}
								</Title>
								{period && (
									<>
										<span className="divider" aria-hidden />
										{/* 안에 날짜 입력칸(div)이 들어가므로 p가 아니라 div */}
										<div className="period-label">
											<PeriodTitle />
										</div>
									</>
								)}
							</div>
							{period && <PeriodPicker />}
						</div>
						{filters && <div className="filters">{filters}</div>}
					</div>
					<div className="results">
						{summary && <p className="summary">{summary}</p>}
						{children}
					</div>
				</StyledSubPage>
			</div>
		</AdminGate>
	);
}

/**
 * 표 칸 폭을 미리 정한다 (빈 값 = 남는 폭). 내용에 맞춰 폭을 정하면 정렬 · 거르기로 줄이 바뀔 때마다 칸이 움직여서
 */
export function Cols({ widths }: { widths: (string | undefined)[] }) {
	return (
		<colgroup>
			{widths.map((width, i) => (
				<col key={i} style={width ? { width } : undefined} />
			))}
		</colgroup>
	);
}

const StyledSubPage = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;

	/* 뒤로 막대와 제목은 한 묶음이라 사이를 좁힌다 */
	.head-left {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
		min-width: 0;
	}

	.page-title {
		white-space: nowrap;
	}

	/* 제목과 기간 사이 얇은 세로줄 */
	.divider {
		width: 1px;
		height: 1.25rem;
		background: ${({ theme }) => theme.color.border};
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.head-left {
			flex-direction: column;
			flex-wrap: nowrap;
			align-items: stretch;
		}

		.divider {
			display: none;
		}
	}

	.conditions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.results {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	}

	/* 기간 제목(괄호 속 날짜로 고르기) 왼쪽, 오늘 · 어제 · … 버튼은 오른쪽 끝 */
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.25rem;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			/* 줄바꿈(wrap)을 끄지 않으면 세로 줄의 폭이 내용 폭이 되어 날짜 칸이 화면 밖으로 넘친다 */
			flex-direction: column;
			flex-wrap: nowrap;
			align-items: stretch;
		}
	}

	.period-label {
		min-width: 0;
		max-width: 100%;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.summary {
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
		font-variant-numeric: tabular-nums;
	}

	/* 거르기 상자: 한 줄에 한 가지, 이름표 칸 폭을 맞춰 칩 · 칸이 같은 자리에서 시작 */
	.filters {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			padding: 0.875rem 1rem;
		}
	}

	/* 찾기 줄 이름표 (거르기 칩 FilterChips와 같은 폭) */
	.chips-label {
		flex-shrink: 0;
		width: 3.5rem;

		/* 좁은 화면은 이름표를 위 한 줄로 */
		@media ${({ theme }) => theme.mediaQuery.mobile} {
			flex-basis: 100%;
		}

		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.subText};
	}

	.search {
		height: 2rem;
		width: 16rem;
		max-width: 100%;
		padding: 0 0.75rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.text};
	}

	/* 두 칸 이상 찾기 (수집 기사: 제목 · 언론사) */
	.searches {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;

		.narrow {
			width: 9rem;
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			.search {
				flex: 1;
				width: auto;
				min-width: 0;
			}

			.search:not(.narrow) {
				flex-basis: 100%;
			}
		}
	}

	/* 찾기 칸 여러 줄 (수집 기사: 언론사 · 제목) */
	form.searches:has(.filter-row) {
		flex-direction: column;
		align-items: stretch;
		gap: 0.75rem;
	}

	.filter-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
	}

	/* 공통 선택 목록을 거르기 줄 높이(2rem)에 맞춘다 */
	.source-select {
		width: 12rem;

		/* 이름표는 줄 앞 '언론사'로 보이므로 칸 위 이름표는 화면 읽기용으로만 */
		label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
			white-space: nowrap;
		}

		.select-display {
			height: 2rem;
			font-size: ${({ theme }) => theme.fontSize.small};
		}
	}

	.search-submit {
		height: 2rem;
		padding: 0 0.875rem;
		border-radius: ${({ theme }) => theme.radius.control};
		background: ${({ theme }) => theme.color.primary};
		color: #ffffff;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		cursor: pointer;
	}

	/* 뉴스레터 주기 묶음 (수집한 기사): 주기 사이에 굵은 구분선, 맨 위에 어느 날 뉴스레터 재료인지 · 수집 기간 */
	/* 모든 주기 머리에 같은 굵은 윗선 (표 머리 바로 아래 첫 주기도: 겹치는 선은 굵은 쪽 하나로 그려진다) */
	tbody.run .run-head th {
		border-top: 2px solid ${({ theme }) => theme.color.text};
	}

	.run-head th {
		padding: 0.625rem 0 0.375rem;
		background: ${({ theme }) => theme.color.surface};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.subText};
		text-indent: 0.5rem;
	}

	/* 쓰인 뉴스레터: 여러 개면 줄마다 */
	.used {
		display: block;
		color: ${({ theme }) => theme.color.primary};
	}

	.state {
		padding: 3rem 0;
		text-align: center;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	/* 표: 좁은 화면은 표만 옆으로 넘긴다 */
	.table-wrap {
		overflow-x: auto;
	}

	/* 칸 폭은 Cols로 고정 (정렬 · 거르기에도 표 모양이 그대로) */
	table {
		width: 100%;
		min-width: 44rem;
		table-layout: fixed;
		border-collapse: collapse;

		&.wide {
			min-width: 60rem;
		}
	}

	td {
		overflow-wrap: anywhere;
	}

	table {
		font-size: ${({ theme }) => theme.fontSize.small};
	}

	th,
	td {
		padding: 0.75rem 1rem 0.75rem 0;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		text-align: left;
		vertical-align: top;
	}

	th:last-child,
	td:last-child {
		padding-right: 0;
	}

	/* 표 머리: 선 · 배경 없이 글자만 본문색으로 굵게 */
	th {
		padding-top: 0.25rem;
		white-space: nowrap;
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.text};
	}

	.nowrap {
		white-space: nowrap;
	}

	.num {
		font-variant-numeric: tabular-nums;
	}

	.category {
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};
	}

	td a:hover {
		text-decoration: underline;
	}

	.content {
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;
	}

	.pagination {
		margin-top: 1rem;
	}
`;
