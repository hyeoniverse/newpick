import { META } from '@/copy';
import { ROUTES } from '@/constants/routes';
import type { Metadata } from 'next';
import { pageMetadata } from '@/constants/site';
import { fetchContactEmail } from '@/api/contact';
import { LEGAL_EFFECTIVE_DATE, termsSections, termsSummary } from '@/content/legal';
import LegalDocument from '@/components/common/legal/LegalDocument';

export const metadata: Metadata = pageMetadata('이용약관', META.terms, ROUTES.terms);

export default async function Page() {
	const email = await fetchContactEmail();
	return (
		<LegalDocument
			doc="terms"
			title="이용약관"
			effectiveDate={LEGAL_EFFECTIVE_DATE}
			intro={META.termsLead}
			summary={termsSummary}
			sections={termsSections(email)}
		/>
	);
}
