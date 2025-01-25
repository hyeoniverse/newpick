import { useAuth } from '@/hooks/useAuth';
import Error from '@/components/common/Error';
import Spinner from '@/components/common/loader/Spinner';

const withAuth = <P extends object>(Component: React.FC<P>) => {
	return function AuthenticatedComponent(props: P) {
		const { user, isLoading } = useAuth();

		if (isLoading) {
			return <Spinner />;
		}

		if (!isLoading && !user) {
			return <Error type="unauthorized" />;
		}

		return <Component {...props} />;
	};
};

export default withAuth;
