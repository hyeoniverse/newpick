'use client';

import { useEffect, useState } from 'react';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
	const router = useRouter();
	const { handleLogin } = useAuth();
	const [statusCode, setStatusCode] = useState<number | null>(null);
	const [message, setMessage] = useState<string>('알 수 없는 오류가 발생했습니다.');
	const [buttonText, setButtonText] = useState<string>('홈으로');
	const [buttonAction, setButtonAction] = useState<() => void>(() => () => router.push('/'));

	useEffect(() => {
		// 상태 코드 추출
		const match = error.message.match(/\d{3}/);
		const code = match ? parseInt(match[0], 10) : 500;

		console.error('❌ 전역 오류 발생:', error);

		setStatusCode(code);

		// 상태 코드별 메시지 및 버튼 설정
		const errorConfig: Record<number, { message: string; buttonText: string; action: () => void }> = {
			400: { message: '잘못된 요청입니다.', buttonText: '다시 시도', action: reset },
			401: { message: '로그인이 필요합니다.', buttonText: '로그인 하기', action: handleLogin },
			403: { message: '접근 권한이 없습니다.', buttonText: '뒤로 가기', action: () => router.back() },
			404: { message: '페이지를 찾을 수 없습니다.', buttonText: '홈으로', action: () => router.push('/') },
			408: {
				message: '요청 시간이 초과되었습니다.',
				buttonText: '새로 고침',
				action: () => window.location.reload(),
			},
			429: {
				message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
				buttonText: '새로 고침',
				action: () => window.location.reload(),
			},
			500: {
				message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
				buttonText: '새로 고침',
				action: () => window.location.reload(),
			},
			502: {
				message: '잘못된 게이트웨이 응답을 받았습니다.',
				buttonText: '새로 고침',
				action: () => window.location.reload(),
			},
			503: {
				message: '서버가 유지보수 중입니다.',
				buttonText: '새로 고침',
				action: () => window.location.reload(),
			},
			504: {
				message: '서버 응답 시간이 초과되었습니다.',
				buttonText: '새로 고침',
				action: () => window.location.reload(),
			},
		};

		// 설정값이 있으면 업데이트
		if (errorConfig[code]) {
			setMessage(errorConfig[code].message);
			setButtonText(errorConfig[code].buttonText);
			setButtonAction(() => errorConfig[code].action);
		}
	}, [error, reset, router, handleLogin]);

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				textAlign: 'center',
				padding: '2rem',
			}}
		>
			<Title size="large" color="error">
				{statusCode ? `오류 ${statusCode}` : '오류 발생'}
			</Title>
			<Text size="large">{message}</Text>

			<div style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
				<Button style={{ width: '50%' }} size="medium" scheme="primary" onClick={buttonAction}>
					{buttonText}
				</Button>
			</div>
		</div>
	);
}
