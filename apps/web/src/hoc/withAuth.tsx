'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/common/loader/Spinner';
import { useMount } from '@/hooks/useMount';
const Error = dynamic(() => import('@/components/common/Error'), { ssr: false });

const withAuth = <P extends object>(Component: React.FC<P>) => {
	return function AuthenticatedComponent(props: P) {
		const { isMounted } = useMount();
		const { user, isLoading } = useAuth();

		if (!isMounted || isLoading) {
			return <Spinner />;
		}

		if (!isLoading && !user) {
			return <Error type="unauthorized" />;
		}

		return <Component {...props} />;
	};
};

export default withAuth;
