'use client';

import { useAuth } from '@/hooks/useAuth';
import { ERROR_STATES } from '@/copy/errors';
import ErrorState from '@/components/common/ErrorState';
import Spinner from '@/components/common/loader/Spinner';
import { useSignedInUser } from '@/components/common/auth/InitialProfile';

/**
 * 관리자 화면 공통 문지기. 로그인은 middleware가 확인하고, 관리자 여부는 여기서 본다.
 * 실제 권한은 API의 @AdminOnly가 지키므로 이건 화면 안내용이다.
 * 브라우저가 프로필을 받기 전에는 서버가 받아 둔 프로필(관리자 layout)로 판단해 첫 HTML부터 화면을 그린다
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
	const { session } = useAuth();
	// 브라우저가 받기 전에는 서버 프로필 (로그아웃하면 쓰지 않는다)
	const user = useSignedInUser();

	if (!user) {
		return session === 'out' ? (
			<ErrorState code={401} {...ERROR_STATES[401]} />
		) : (
			<div className="flex justify-center px-4 py-24">
				<Spinner />
			</div>
		);
	}
	if (user.role !== 'admin') {
		return <ErrorState code={403} {...ERROR_STATES[403]} />;
	}
	return <>{children}</>;
}
