import type { Metadata } from 'next';
import { fetchContactEmail } from '@/api/contact';
import { LEGAL_EFFECTIVE_DATE, privacySections } from '@/constants/legal';
import LegalDocument from '@/components/common/legal/LegalDocument';

export const metadata: Metadata = { title: '개인정보처리방침 | 뉴픽: NewPick' };

export default async function Page() {
	const email = await fetchContactEmail();
	return (
		<LegalDocument
			title="개인정보처리방침"
			effectiveDate={LEGAL_EFFECTIVE_DATE}
			intro="뉴픽은 이용자의 개인정보를 소중히 다루며, 「개인정보 보호법」에 따라 어떤 정보를 왜 모으고 어떻게 보호하는지 알려 드립니다."
			sections={privacySections(email)}
		/>
	);
}
