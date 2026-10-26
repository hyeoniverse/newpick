'use client';

import { useEffect } from 'react';
import { errorStateFor, statusOf } from '@/constants/errors';
import ErrorState from '@/components/common/ErrorState';

/**
 * 화면을 그리다 난 오류. 상태 코드에 맞는 문구와 다음에 할 일을 보여 준다.
 * 서버에서 난 오류는 배포 환경에서 메시지가 가려지므로(digest만 옴) 코드를 모르면 500으로 본다
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	const status = statusOf(error);

	useEffect(() => {
		console.error('화면 오류:', error);
	}, [error]);

	return <ErrorState code={status} {...errorStateFor(status)} onRetry={reset} />;
}
