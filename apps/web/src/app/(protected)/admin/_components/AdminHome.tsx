'use client';

import { useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useToast } from '@/hooks/useToast';
import styles from '@/app/(protected)/protected.module.css';
import AdminGate from '@/components/common/auth/AdminGate';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import Dashboard from '@/app/(protected)/admin/_components/Dashboard';

/** 마지막으로 비운 시각을 '오후 3:04:12'처럼 */
const timeText = (iso: string) => new Date(iso).toLocaleTimeString('ko-KR');

function SiteCacheTool() {
	const { showToast } = useToast();
	const [pending, setPending] = useState(false);
	const [lastAt, setLastAt] = useState<string | null>(null);

	const refresh = async () => {
		setPending(true);
		try {
			const { data } = await apiFetch<{ data: { refreshedAt: string } }>(API_ENDPOINTS.ADMIN.SITE_CACHE_REFRESH(), {
				method: 'POST',
			});
			setLastAt(data.refreshedAt);
			showToast('사이트 캐시를 비웠습니다. 다음 접속부터 새 내용이 보여요.', 'success');
		} catch (error) {
			showToast(error instanceof ApiError ? error.message : '사이트 캐시를 비우지 못했습니다.', 'error');
		} finally {
			setPending(false);
		}
	};

	return (
		<StyledTool>
			<div>
				<Title as="h2" size="extraSmall" weight="bold">
					사이트 캐시 비우기
				</Title>
				<Text size="small" color="subText">
					첫 화면 · 목록은 빠르게 보여 주기 위해 최대 10분 동안 저장해 둔 내용을 씁니다. 뉴스레터를 만들거나 지우면 저절로
					비워지고, DB를 손으로 고쳤을 때는 여기서 바로 비웁니다.
				</Text>
				{lastAt && (
					<Text size="small" color="primary" className="last">
						마지막으로 비운 시각 {timeText(lastAt)}
					</Text>
				)}
			</div>
			<Button scheme="primary" size="small" onClick={refresh} disabled={pending}>
				{pending ? '비우는 중…' : '지금 비우기'}
			</Button>
		</StyledTool>
	);
}

/** 관리자 첫 화면: 대시보드(#21) + 운영 도구 목록. 마이페이지와 같은 틀(제목 한 줄 · 구분선으로 나눈 줄 · 작은 버튼) */
export default function AdminHome() {
	return (
		<AdminGate>
			<div className={styles.page}>
				<Title size="extraSmall">관리자</Title>
				<Dashboard />
				<SiteCacheTool />
				<StyledTool>
					<div>
						<Title as="h2" size="extraSmall" weight="bold">
							디자인 시스템
						</Title>
						<Text size="small" color="subText">
							테마 값과 공통 컴포넌트를 한 화면에서 확인합니다.
						</Text>
					</div>
					<Link href="/admin/ui">
						<Button scheme="monoOutline" size="small">
							열기
						</Button>
					</Link>
				</StyledTool>
			</div>
		</AdminGate>
	);
}

/** 마이페이지 '회원 탈퇴' 줄과 같은 모양: 위 구분선, 왼쪽 제목·설명, 오른쪽 버튼 (모바일은 아래로) */
const StyledTool = styled.section`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1.5rem;
	margin-top: 2.5rem;
	padding-top: 2rem;
	border-top: 1px solid ${({ theme }) => theme.color.border};

	> div {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		max-width: 44rem;
		word-break: keep-all;
	}

	.last {
		font-variant-numeric: tabular-nums;
	}

	button {
		flex-shrink: 0;
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		flex-direction: column;
		align-items: flex-start;
	}
`;
