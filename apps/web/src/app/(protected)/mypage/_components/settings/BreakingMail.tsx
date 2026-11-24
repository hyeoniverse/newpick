'use client';

import type { BreakingMailSettings } from '@newpick/shared';
import { BREAKING } from '@/copy';
import { queryKeys } from '@/api/queryKeys';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBreakingMail, saveBreakingMail } from '@/api/subscription';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import Switch from '@/components/common/Switch';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';

const KEY = queryKeys.breakingMail;
const COPY = BREAKING.settings;
const DEFAULTS: BreakingMailSettings = { enabled: true, night: false };

/**
 * 마이페이지 > 설정의 속보 메일: 받기(기본 켜짐) · 밤에도 바로 받기(기본 꺼짐: 밤에 나간 속보는 아침 7시에).
 * 맞춤 메일과 같은 모양 · 동작: 누르면 바로 저장되고, 실패하면 되돌린다. 받기를 끄면 밤 설정은 쓸 수 없다
 */
export default function BreakingMail() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { data, isPending } = useQuery({
		queryKey: KEY,
		queryFn: fetchBreakingMail,
		enabled: user?.isSubscribed != null,
	});
	const save = useMutation({
		mutationFn: saveBreakingMail,
		onMutate: (next) => {
			const before = queryClient.getQueryData<BreakingMailSettings>(KEY);
			queryClient.setQueryData(KEY, { ...DEFAULTS, ...before, ...next });
			return { before };
		},
		onError: (_error, _next, context) => {
			queryClient.setQueryData(KEY, context?.before);
			showToast(COPY.saveFailed, 'error');
		},
		onSuccess: (_saved, next) =>
			showToast(
				next.enabled !== undefined ? (next.enabled ? COPY.on : COPY.off) : next.night ? COPY.nightOn : COPY.nightOff,
				'success',
			),
	});

	// 맞춤 메일과 같은 기준: 구독 기록이 있을 때만
	if (user?.isSubscribed == null) return null;
	const { enabled, night } = data ?? DEFAULTS;
	const busy = isPending || save.isPending;

	return (
		<section className="np-mypage-personal-mail-personal-mail">
			<div className="head">
				<Title size="extraSmall" weight="bold" as="h2">
					{COPY.title}
				</Title>
				<Text size="small" color="subText">
					{COPY.lead}
					{user.isSubscribed === false && (
						<>
							<br />
							{COPY.paused}
						</>
					)}
				</Text>
			</div>
			<div className="control">
				<Switch
					checked={enabled}
					label={COPY.title}
					disabled={busy}
					onChange={(next) => save.mutate({ enabled: next })}
				/>
				<span aria-hidden>{enabled ? '켜짐' : '꺼짐'}</span>
			</div>
			<div className="head">
				<Text size="small" weight="bold">
					{COPY.night}
				</Text>
				<Text size="small" color="subText">
					{COPY.nightNote}
				</Text>
			</div>
			<div className="control">
				<Switch
					checked={night}
					label={COPY.night}
					disabled={busy || !enabled}
					onChange={(next) => save.mutate({ night: next })}
				/>
				<span aria-hidden>{night ? '켜짐' : '꺼짐'}</span>
			</div>
		</section>
	);
}
