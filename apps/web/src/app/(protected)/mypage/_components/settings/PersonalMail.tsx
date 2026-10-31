'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { fetchPersonalMail, savePersonalMail } from '@/api/subscription';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import Switch from '@/components/common/Switch';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';

const PERSONAL_MAIL_KEY = ['personal-mail'];

/**
 * 마이페이지 > 설정의 맞춤 메일 (#123 16): 켜 두면 북마크 · 스크랩을 바탕으로 그날 모든 분야에서 골라 보내고,
 * 끄면 구독한 분야의 뉴스레터를 분야별로 보낸다. 누르면 바로 저장되고 다음 메일부터 적용된다.
 * 구독이 멈춰 있어도 보인다 (다시 시작하면 그 설정대로)
 */
export default function PersonalMail() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { data, isPending } = useQuery({
		queryKey: PERSONAL_MAIL_KEY,
		queryFn: fetchPersonalMail,
		enabled: user?.isSubscribed != null,
	});
	const save = useMutation({
		mutationFn: savePersonalMail,
		// 누르자마자 스위치가 바뀌고, 실패하면 되돌린다
		onMutate: (enabled) => {
			const before = queryClient.getQueryData<{ enabled: boolean }>(PERSONAL_MAIL_KEY);
			queryClient.setQueryData(PERSONAL_MAIL_KEY, { enabled });
			return { before };
		},
		onError: (_error, _enabled, context) => {
			queryClient.setQueryData(PERSONAL_MAIL_KEY, context?.before);
			showToast('설정을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error');
		},
		onSuccess: ({ enabled }) => showToast(enabled ? '맞춤 메일을 켰습니다.' : '맞춤 메일을 껐습니다.', 'success'),
	});

	// 구독 기록이 있을 때만 (구독 해지 단추와 같은 기준). 일시 중지 중에도 미리 정해 둘 수 있다
	if (user?.isSubscribed == null) return null;
	const enabled = data?.enabled ?? true;

	return (
		<StyledPersonalMail>
			<div className="head">
				<div>
					<Title size="extraSmall" weight="bold" as="h2">
						맞춤 메일
					</Title>
					<Text size="small" color="subText">
						북마크 · 스크랩한 소식을 바탕으로 그날 모든 분야에서 관심 있을 소식을 골라 보내드립니다.
						<br />
						끄면 구독한 분야의 뉴스레터를 분야별로 받습니다. 다음 메일부터 적용됩니다.
						{user.isSubscribed === false && (
							<>
								<br />
								지금은 구독이 멈춰 있어, 구독을 다시 시작하면 이 설정대로 보내드립니다.
							</>
						)}
					</Text>
				</div>
				<Switch
					checked={enabled}
					label="맞춤 메일"
					disabled={isPending || save.isPending}
					onChange={(next) => save.mutate(next)}
				/>
			</div>
		</StyledPersonalMail>
	);
}

const StyledPersonalMail = styled.section`
	margin-top: 4rem;
	padding-top: 2rem;
	border-top: 1px solid ${({ theme }) => theme.color.border};
	word-break: keep-all;

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;

		> div {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
		}
	}
`;
