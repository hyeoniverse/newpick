import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { CATEGORIES } from '@/constants/categories';
import { fetchEditionPreview } from '@/api/edition';
import { useOpenSubscribe } from '@/hooks/useOpenSubscribe';

import { LuCircleAlert, LuMailOpen } from 'react-icons/lu';
import Button from '@/components/common/Button';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Skeleton from '@/components/common/loader/Skeleton';
import MailView from '@/components/common/MailView';
import { cx } from '@/styles/tw';

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
					<MailView subject={data.subject} html={data.html} title="구독 메일 미리보기" />
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

const StyledTrial = ({ className, ...props }: React.ComponentProps<'div'>) => (
	<div className={cx('np-home-trial-trial', className)} {...props} />
);

/** 받은편지함에서 연 메일 모양. 시트 폭이 메일 폭(600px)에 맞춰져 있어 본문(iframe)이 꽉 찬다 */
const StyledMail = ({ className, ...props }: React.ComponentProps<'div'>) => (
	<div className={cx('np-home-trial-mail', className)} {...props} />
);
