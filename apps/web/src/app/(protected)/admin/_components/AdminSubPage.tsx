'use client';

import { useRouter } from 'next/navigation';
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
	/** 뒤로 막대 (기본: 관리자 대시보드). 기간은 그대로 들고 간다 */
	back?: { text: string; href: string };
	children: React.ReactNode;
}

/**
 * 관리자 상세 화면 틀 (#21): ← 대시보드 · 제목 · 기간(주소에 남음) · 거르기 · 본문.
 * 대시보드는 요약만, 전체는 여기서 쪽 단위로
 */
export default function AdminSubPage({ title, summary, filters, period = true, back, children }: Props) {
	const router = useRouter();
	const { periodQuery } = useAdminQuery();
	return (
		<AdminGate>
			<div className="np-protected-page">
				<div className="np-admin-admin-sub-page-sub-page">
					{/* 세 묶음: 머리(뒤로 막대) / 조건(제목 · 기간 한 줄, 거르기) / 결과(건수 · 표 · 쪽) */}
					{/* 기사 상세의 '목록으로'와 같은 막대: 스크롤하면 위에 붙고, 내릴 땐 화살표만.
					    화면 끝까지 따라오도록 묶음 밖(맨 바깥 틀의 바로 아래)에 둔다 */}
					<BackBar
						text={back?.text ?? '관리자 대시보드'}
						onClick={() => router.push(`${back?.href ?? '/admin'}${periodQuery}`)}
					/>
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
				</div>
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
