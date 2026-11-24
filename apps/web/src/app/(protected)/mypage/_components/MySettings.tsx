'use client';

import StartSubscription from '@/app/(protected)/mypage/_components/settings/StartSubscription';
import DeleteAccount from '@/app/(protected)/mypage/_components/settings/DeleteAccount';
import AccountEmail from '@/app/(protected)/mypage/_components/settings/AccountEmail';
import LoginSessions from '@/app/(protected)/mypage/_components/settings/LoginSessions';
import PersonalMail from '@/app/(protected)/mypage/_components/settings/PersonalMail';
import BreakingMail from '@/app/(protected)/mypage/_components/settings/BreakingMail';

export default function MyNewsletterSubscribe() {
	return (
		<div>
			<StartSubscription />
			<PersonalMail />
			<BreakingMail />
			<AccountEmail />
			<LoginSessions />
			<DeleteAccount />
		</div>
	);
}
