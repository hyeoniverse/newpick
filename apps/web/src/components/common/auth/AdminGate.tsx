'use client';

import styled from 'styled-components';
import { useAuth } from '@/hooks/useAuth';
import { ERROR_STATES } from '@/constants/errors';
import ErrorState from '@/components/common/ErrorState';
import Spinner from '@/components/common/loader/Spinner';

/**
 * 관리자 화면 공통 문지기. 로그인은 middleware가 확인하고, 관리자 여부는 여기서 본다.
 * 실제 권한은 API의 @AdminOnly가 지키므로 이건 화면 안내용이다
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
	const { user, session } = useAuth();

	if (!user) {
		return session === 'out' ? (
			<ErrorState code={401} {...ERROR_STATES[401]} />
		) : (
			<StyledGate>
				<Spinner />
			</StyledGate>
		);
	}
	if (user.role !== 'admin') {
		return <ErrorState code={403} {...ERROR_STATES[403]} />;
	}
	return <>{children}</>;
}

const StyledGate = styled.div`
	display: flex;
	justify-content: center;
	padding: 6rem 1rem;
`;
