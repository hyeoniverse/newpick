import type { Metadata } from 'next';
import { fetchContactEmail } from '@/api/contact';
import { LEGAL_EFFECTIVE_DATE, privacySections, privacySummary } from '@/constants/legal';
import LegalDocument from '@/components/common/legal/LegalDocument';

export const metadata: Metadata = { title: '개인정보 처리방침' };

export default async function Page() {
	const email = await fetchContactEmail();
	return (
		<LegalDocument
			doc="privacy"
			title="개인정보 처리방침"
			effectiveDate={LEGAL_EFFECTIVE_DATE}
			intro="뉴픽은 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 어떤 목적으로 처리하고 어떻게 보호하는지 알려 드립니다. 서비스 운영에 꼭 필요한 정보만 처리합니다."
			summary={privacySummary}
			sections={privacySections(email)}
		/>
	);
}
