'use client';

import { LuCheck, LuPlus } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import { useTagFollows } from '@/hooks/useTagFollows';
import { cx } from '@/styles/tw';

interface Props {
	tag: string;
	className?: string;
	/** '팔로우' 이름표 옆에 모아 둘 때: 글자는 태그 이름만 (+ · ✓ 아이콘으로 상태, 읽는 이름에는 '팔로우'를 넣는다) */
	tagOnly?: boolean;
}

/** 태그 팔로우 단추 (#123): 팔로우하면 메일의 '팔로우한 태그' 칸에 이 태그의 소식을 모은다. 로그인하지 않았으면 로그인 창 */
export default function TagFollowButton({ tag, className, tagOnly }: Props) {
	const { user } = useAuth();
	const openLogin = useOpenLogin();
	const { isFollowing, follow, unfollow } = useTagFollows();
	const on = !!user && isFollowing(tag);
	const busy = follow.isPending || unfollow.isPending;

	return (
		<button
			type="button"
			className={cx(
				// 틀 · 크기는 styles/parts.css (.np-tag-follow): 화면 CSS가 줄일 수 있게 components 층
				'np-tag-follow',
				'disabled:cursor-progress disabled:opacity-60',
				// 같은 속성 클래스가 둘 붙으면 순서로 갈리므로 켜짐 · 꺼짐 중 하나만
				on
					? 'on border-primary bg-tertiary text-primary'
					: 'border-border bg-background text-sub-text hover:enabled:border-primary hover:enabled:text-primary',
				className,
			)}
			aria-pressed={on}
			aria-label={tagOnly ? `#${tag} 팔로우` : undefined}
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
			{tagOnly ? `#${tag}` : on ? `#${tag} 팔로우 중` : `#${tag} 팔로우`}
		</button>
	);
}
