import type { MailsPage } from '@newpick/shared';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';

/** 마이페이지 받은 메일 */

/** 받은 메일 한 쪽. filters: 폴더 · 중요 등 쿼리 */
export const fetchMyMails = (offset: number, limit: number, filters?: string) =>
	apiFetch<MailsPage>(API_ENDPOINTS.MY.MAILS(offset, limit, filters));
/** 받은 메일 수만 (한 개짜리 쪽) */
export const fetchMyMailCount = () => apiFetch<{ counts: { all: number } }>(API_ENDPOINTS.MY.MAILS(0, 1));
/** 받은 그대로의 메일 한 통 */
export const fetchMyMail = (sentAt: string) =>
	apiFetch<{ subject: string; html: string }>(API_ENDPOINTS.MY.MAIL(sentAt));
/** 메일 한 통 표시 (중요 · 폴더) */
export const markMail = (body: { sentAt: string; starred?: boolean; folderId?: number | null }) =>
	apiFetch(API_ENDPOINTS.MY.MAIL_MARK(), { method: 'PATCH', body });
