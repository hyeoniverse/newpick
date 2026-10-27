'use client';

import { DELETED_NEWSLETTER } from '@/constants/errors';
import ErrorState from '@/components/common/ErrorState';

/** 지웠거나 없는 뉴스레터 주소 (서버가 404로 응답) */
export default function NewsletterNotFound() {
	return <ErrorState code={404} {...DELETED_NEWSLETTER} />;
}
