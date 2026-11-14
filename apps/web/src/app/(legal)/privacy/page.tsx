import { META } from '@/copy';
import { ROUTES } from '@/constants/routes';
import type { Metadata } from 'next';
import { pageMetadata } from '@/constants/site';
import { fetchContactEmail } from '@/api/contact';
import { PRIVACY_EFFECTIVE_DATE, privacySections, privacySummary } from '@/content/legal';
import LegalDocument from '@/components/common/legal/LegalDocument';

export const metadata: Metadata = pageMetadata('개인정보 처리방침', META.privacy, ROUTES.privacy);

export default async function Page() {
	const email = await fetchContactEmail();
	return (
		<LegalDocument
			doc="privacy"
			title="개인정보 처리방침"
			effectiveDate={PRIVACY_EFFECTIVE_DATE}
			intro={META.privacyLead}
			summary={privacySummary}
			sections={privacySections(email)}
		/>
	);
}
