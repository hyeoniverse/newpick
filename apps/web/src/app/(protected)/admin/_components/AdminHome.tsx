'use client';

import { ADMIN } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { refreshSiteCache } from '@/api/admin';
import { errorMessage } from '@/api/client';
import { useToast } from '@/hooks/useToast';
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
			const data = await refreshSiteCache();
			setLastAt(data.refreshedAt);
			showToast(ADMIN.cache.cleared, 'success');
		} catch (error) {
			showToast(errorMessage(error, ADMIN.cache.clearFailed), 'error');
		} finally {
			setPending(false);
		}
	};

	return (
		<section className="np-admin-admin-home-tool">
			<div>
				<Title as="h2" size="extraSmall" weight="bold">
					사이트 캐시 비우기
				</Title>
				<Text size="small" color="subText">
					{ADMIN.cache.lead}
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
		</section>
	);
}

/** 관리자 첫 화면: 운영 도구 목록 + 대시보드(#21). 마이페이지와 같은 틀(제목 한 줄 · 구분선으로 나눈 줄 · 작은 버튼) */
export default function AdminHome() {
	return (
		<AdminGate>
			<div className="np-protected-page">
				<Title size="extraSmall">관리자</Title>
				<SiteCacheTool />
				<section className="np-admin-admin-home-tool">
					<div>
						<Title as="h2" size="extraSmall" weight="bold">
							디자인 시스템
						</Title>
						<Text size="small" color="subText">
							{ADMIN.home.designLead}
						</Text>
					</div>
					<Link href={ROUTES.admin.ui}>
						<Button scheme="monoOutline" size="small">
							열기
						</Button>
					</Link>
				</section>
				{/* 콘텐츠 · 회원 관리 (#31): 뉴스레터 고치기 · 사용자 · 구독자 · 관심사 · 태그 */}
				<section className="np-admin-admin-home-tool">
					<div>
						<Title as="h2" size="extraSmall" weight="bold">
							콘텐츠 · 회원 관리
						</Title>
						<Text size="small" color="subText">
							{ADMIN.home.cmsLead}
						</Text>
					</div>
					<nav className="manage" aria-label="콘텐츠 · 회원 관리">
						{[
							[ROUTES.admin.stats, '통계'],
							[ROUTES.admin.newsletters, '뉴스레터'],
							[ROUTES.admin.users, '사용자'],
							[ROUTES.admin.subscribers, '구독자'],
							[ROUTES.admin.categories, '관심사'],
							[ROUTES.admin.tags, '태그'],
						].map(([href, label]) => (
							<Link key={href} href={href}>
								<Button scheme="monoOutline" size="small">
									{label}
								</Button>
							</Link>
						))}
					</nav>
				</section>
				{/* 운영 도구 아래에 기록(대시보드). 기간을 주소(?from=&to=)에서 읽으므로 Suspense 안에 */}
				<div className="np-admin-admin-home-records">
					<Suspense fallback={null}>
						<Dashboard />
					</Suspense>
				</div>
			</div>
		</AdminGate>
	);
}

/** 마이페이지 '회원 탈퇴' 줄과 같은 모양: 위 구분선, 왼쪽 제목·설명, 오른쪽 버튼 (모바일은 아래로) */
