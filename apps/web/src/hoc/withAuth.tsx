import { useAuth } from '@/hooks/useAuth';
import Error from '@/components/common/Error';
import Spinner from '@/components/common/loader/Spinner';

const withAuth = (Component: React.FC) => {
	return function AuthenticatedComponent(props: React.ComponentProps<typeof Component>) {
		const { user, isLoading } = useAuth();

		// 로딩 중이거나 `authChecked`가 완료되지 않았을 때 `Spinner` 유지
		if (isLoading) {
			return <Spinner />;
		}

		// 로딩이 끝났지만 `isAuthenticated`가 false이면 `Error` 렌더링
		if (!isLoading && !user) {
			return <Error type="unauthorized" />;
		}

		return <Component {...props} />;
	};
};

export default withAuth;
