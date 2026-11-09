import { ROUTES } from '@/constants/routes';
import { useId } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import useSubscribe from '@/hooks/useSubscribe';
import { cx } from '@/styles/tw';
import InputCheck from '@/components/common/InputCheck';
import Text from '@/components/common/Text';
import { LuCircleCheck } from 'react-icons/lu';

interface Props {
	name: string;
	className?: string;
}

/* 동의 문구의 글자 조각은 한 줄 가운데 맞춤 */
const INLINE = 'inline-flex align-middle';
const LINK = 'font-bold text-primary hover:underline';

export default function ArgreementCheck({ name, className }: Props) {
	const { user } = useAuth();
	const { status: isSubscribed = user?.isSubscribed, isChanging: isChangingSubscription } = useSubscribe();
	// 옆의 동의 문구(링크가 섞여 있어 label로 감쌀 수 없음)를 체크 상자의 이름으로 (#16)
	const textId = useId();

	return (
		<div
			className={cx('mt-2 inline-flex w-full gap-2 text-left text-extra-small leading-[1.5] text-sub-text', className)}
		>
			{isSubscribed === null ? (
				<>
					<InputCheck
						className="agreement-check"
						name={name}
						disabled={isChangingSubscription || isSubscribed !== null}
						aria-labelledby={textId}
						aria-required
					/>
					<div id={textId} className="agreement-text">
						<Text size="extraSmall" weight="semiBold" color="primary" className={INLINE}>
							[필수]&nbsp;
						</Text>
						<Text size="extraSmall" className={INLINE}>
							NewPick의&nbsp;
						</Text>
						{/* 구독 창을 닫지 않고 읽을 수 있게 새 탭으로 */}
						<Link href={ROUTES.terms} target="_blank" className={LINK}>
							이용약관
						</Link>
						&nbsp;·&nbsp;
						<Link href={ROUTES.privacy} target="_blank" className={LINK}>
							개인정보 처리방침
						</Link>
						<Text size="extraSmall" className={INLINE}>
							에 동의합니다.
						</Text>
					</div>
				</>
			) : (
				// 이미 동의한 사람: 눈에 띄는 안내 대신 회색 한 줄로 (무엇에 동의했는지 링크와 함께)
				<p className="agreed m-0 inline-flex items-center text-sub-text [&_svg]:mr-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-primary">
					<LuCircleCheck aria-hidden />
					<Link href={ROUTES.terms} target="_blank" className="font-[inherit] text-inherit underline">
						이용약관
					</Link>
					&nbsp;·&nbsp;
					<Link href={ROUTES.privacy} target="_blank" className="font-[inherit] text-inherit underline">
						개인정보 처리방침
					</Link>
					에 동의했습니다.
				</p>
			)}
		</div>
	);
}
