import API_ENDPOINTS from '@/constants/api';
import { apiFetch } from '@/api/client';

/** 문의처는 거의 바뀌지 않으므로 서버에서 하루 동안 캐시합니다. */
const CONTACT_REVALIDATE_SECONDS = 60 * 60 * 24;

/** 서비스 문의처 = 구독 메일 발송 주소. 받지 못하면 null (화면에서 숨긴다) */
export const fetchContactEmail = async (): Promise<string | null> => {
	try {
		const contact = await apiFetch<{ email: string | null }>(API_ENDPOINTS.CONTACT(), {
			next: { revalidate: CONTACT_REVALIDATE_SECONDS },
		});
		return contact.email ?? null;
	} catch (error) {
		console.error(error);
		return null;
	}
};
