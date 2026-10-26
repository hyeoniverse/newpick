import type { Metadata } from 'next';
import { fetchContactEmail } from '@/api/contact';
import { LEGAL_EFFECTIVE_DATE, termsSections } from '@/constants/legal';
import LegalDocument from '@/components/common/legal/LegalDocument';

export const metadata: Metadata = { title: '이용약관 | 뉴픽: NewPick' };

export default async function Page() {
	const email = await fetchContactEmail();
	return (
		<LegalDocument
			title="이용약관"
			effectiveDate={LEGAL_EFFECTIVE_DATE}
			intro="뉴픽 서비스를 이용하는 조건과 절차를 안내합니다."
			sections={termsSections(email)}
		/>
	);
}
