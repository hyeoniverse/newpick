'use client';

import StartSubscription from '@/app/(protected)/mypage/_components/settings/StartSubscription';
import DeleteAccount from '@/app/(protected)/mypage/_components/settings/DeleteAccount';

export default function MyNewsletterSubscribe() {
	return (
		<div>
			<StartSubscription />
			<DeleteAccount />
		</div>
	);
}
