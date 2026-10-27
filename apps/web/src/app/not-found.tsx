'use client';

import { ERROR_STATES } from '@/constants/errors';
import ErrorState from '@/components/common/ErrorState';

/** 없는 주소 (404) */
export default function NotFoundPage() {
	return <ErrorState code={404} {...ERROR_STATES[404]} />;
}
