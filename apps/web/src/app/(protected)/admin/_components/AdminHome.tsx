'use client';

import { useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { LuRefreshCw, LuPalette, LuChevronRight } from 'react-icons/lu';
import { apiFetch, ApiError } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useToast } from '@/hooks/useToast';
import AdminGate from '@/components/common/auth/AdminGate';
import BorderTitle from '@/components/common/BorderTitle';
import Button from '@/components/common/Button';

/** 마지막으로 비운 시각을 '오후 3:04:12'처럼 */
const timeText = (iso: string) => new Date(iso).toLocaleTimeString('ko-KR');

function SiteCacheCard() {
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
		<li className="tool">
			<LuRefreshCw className="icon" aria-hidden />
			<div className="copy">
				<h2>사이트 캐시 비우기</h2>
				<p>
					첫 화면 · 목록은 빠르게 보여 주려고 최대 10분 동안 저장해 둔 내용을 씁니다. 뉴스레터를 만들거나 지우면 저절로
					비워지고, DB를 손으로 고쳤을 때는 여기서 바로 비웁니다.
				</p>
				{lastAt && <p className="last">마지막으로 비운 시각 {timeText(lastAt)}</p>}
			</div>
			<Button scheme="primary" onClick={refresh} disabled={pending}>
				{pending ? '비우는 중…' : '지금 비우기'}
			</Button>
		</li>
	);
}

/** 관리자 첫 화면: 운영 도구 목록 */
export default function AdminHome() {
	return (
		<AdminGate>
			<StyledAdmin>
				<BorderTitle text="ADMIN" />
				<ul className="tools">
					<SiteCacheCard />
					<li className="tool">
						<LuPalette className="icon" aria-hidden />
						<div className="copy">
							<h2>디자인 시스템</h2>
							<p>테마 값과 공통 컴포넌트를 한 화면에서 확인합니다.</p>
						</div>
						<Link href="/admin/ui" className="link">
							열기 <LuChevronRight aria-hidden />
						</Link>
					</li>
				</ul>
			</StyledAdmin>
		</AdminGate>
	);
}

const StyledAdmin = styled.div`
	margin: 3rem 0 6rem;
	word-break: keep-all;

	.tools {
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid ${({ theme }) => theme.color.text};
	}

	.tool {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 1.25rem;
		padding: 1.75rem 0.25rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: auto minmax(0, 1fr);

			button,
			.link {
				grid-column: 2;
				justify-self: start;
			}
		}
	}

	.icon {
		align-self: start;
		width: 1.5rem;
		height: 1.5rem;
		margin-top: 0.125rem;
		color: ${({ theme }) => theme.color.primary};
	}

	.copy {
		h2 {
			margin: 0 0 0.375rem;
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: 800;
			color: ${({ theme }) => theme.color.text};
		}

		p {
			margin: 0;
			max-width: 40rem;
			line-height: 1.7;
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};
		}

		.last {
			margin-top: 0.5rem;
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};

		&:hover {
			text-decoration: underline;
		}
	}
`;
