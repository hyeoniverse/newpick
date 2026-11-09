import {
	JOB_ENDPOINT,
	type AdminArticlePage,
	type AdminCategoryRow,
	type AdminMailRow,
	type AdminSubscriberPage,
	type AdminUserRow,
	type AiLogPage,
	type CostStats,
	type Dashboard,
	type DeliveryStats,
	type JobName,
	type JobRunRecord,
	type MailRecipient,
	type Newsletter,
	type NewsletterListItem,
	type PageStats,
	type Paged,
	type Schedule,
	type SubscriberStats,
	type TagRule,
	type TasteStats,
	type TrafficStats,
	type UserRole,
} from '@newpick/shared';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';

/**
 * 관리자 화면이 쓰는 api 요청 (#21 · #31 · #122). 화면은 apiFetch를 직접 부르지 않고 여기 함수만 쓴다.
 * 응답의 { data }는 여기서 벗겨 돌려준다
 */
const data = <T>(url: string) => apiFetch<{ data: T }>(url).then((r) => r.data);

// ---- 대시보드 · 예약 작업 ----
export const fetchDashboard = (from: string, to: string) =>
	data<Dashboard>(`${API_ENDPOINTS.ADMIN.DASHBOARD()}?from=${from}&to=${to}`);
export const fetchMailRecipients = (date: string) => data<MailRecipient[]>(API_ENDPOINTS.ADMIN.MAIL_RECIPIENTS(date));
export const fetchSchedule = () => data<Schedule>(API_ENDPOINTS.ADMIN.SCHEDULE());
export const saveSchedule = (next: Schedule) =>
	apiFetch<{ data: Schedule }>(API_ENDPOINTS.ADMIN.SCHEDULE(), { method: 'PUT', body: next }).then((r) => r.data);
/** 예약 작업 켜기 · 끄기 */
export const toggleJob = (job: JobName, enable: boolean) =>
	apiFetch(API_ENDPOINTS.ADMIN.TOGGLE(JOB_ENDPOINT[job]), { method: 'POST', body: { enable } });
/** 지금 실행 */
export const runJobNow = (job: JobName) => apiFetch(API_ENDPOINTS.ADMIN.RUN_NOW(JOB_ENDPOINT[job]), { method: 'POST' });
/**
 * AI 요약 다시 만들기: date(지난 날 · 그날 없는 관심사만), categoryId(그 관심사만), newsletterId(그 뉴스레터를 다시 작성).
 * 그날 이미 있는 관심사는 서버가 건너뛴다
 */
export const rerunSummary = (target: { date?: string; categoryId?: number | null; newsletterId?: number }) =>
	apiFetch(API_ENDPOINTS.ADMIN.RUN_NOW(JOB_ENDPOINT.summary), { method: 'POST', body: target });
export const refreshSiteCache = () =>
	apiFetch<{ data: { refreshedAt: string } }>(API_ENDPOINTS.ADMIN.SITE_CACHE_REFRESH(), { method: 'POST' }).then(
		(r) => r.data,
	);

// ---- 목록 (query: URLSearchParams 문자열) ----
export const fetchNewsletterList = (query: string) =>
	data<Paged<NewsletterListItem>>(API_ENDPOINTS.ADMIN.LIST('newsletters', query));
export const fetchArticleList = (query: string) => data<AdminArticlePage>(API_ENDPOINTS.ADMIN.LIST('articles', query));
export const fetchMailList = (query: string) => data<Paged<AdminMailRow>>(API_ENDPOINTS.ADMIN.LIST('mails', query));
export const fetchAiLogs = (query: string) => data<AiLogPage>(API_ENDPOINTS.ADMIN.LIST('ai-logs', query));
export const fetchJobRuns = (query: string) => data<Paged<JobRunRecord>>(API_ENDPOINTS.ADMIN.LIST('job-runs', query));
export const fetchUsers = (query: string) => data<Paged<AdminUserRow>>(API_ENDPOINTS.ADMIN.USERS(query));
export const fetchSubscribers = (query: string) => data<AdminSubscriberPage>(API_ENDPOINTS.ADMIN.SUBSCRIBERS(query));
export const fetchCategories = () => data<AdminCategoryRow[]>(API_ENDPOINTS.ADMIN.CATEGORIES());

// ---- 사용자 ----
export const changeUserRole = (id: number, role: UserRole) =>
	apiFetch(API_ENDPOINTS.ADMIN.USER(id), { method: 'PATCH', body: { role } });
export const deleteUser = (id: number) => apiFetch(API_ENDPOINTS.ADMIN.USER(id), { method: 'DELETE' });

// ---- 뉴스레터 고치기 ----
export const fetchNewsletter = (id: number) =>
	data<{ newsletter: Newsletter }>(API_ENDPOINTS.ADMIN.NEWSLETTER(id)).then((d) => d.newsletter);
export const updateNewsletter = (
	id: number,
	body: Partial<Pick<Newsletter, 'title' | 'subtitle' | 'content' | 'keywords' | 'categoryId' | 'contentAsHTML'>>,
) => apiFetch(API_ENDPOINTS.ADMIN.NEWSLETTER(id), { method: 'PATCH', body });
export const resetNewsletterViews = (id: number) =>
	apiFetch(API_ENDPOINTS.ADMIN.NEWSLETTER_RESET_VIEWS(id), { method: 'POST' });
export const deleteNewsletter = (id: number) => apiFetch(API_ENDPOINTS.ADMIN.NEWSLETTER(id), { method: 'DELETE' });

// ---- 태그 정돈 ----
export const fetchTagRules = () => data<TagRule[]>(API_ENDPOINTS.ADMIN.TAG_RULES());
/** 태그 합치기 · 이름 바꾸기: 바꾼 뉴스레터 수 */
export const mergeTags = (from: string[], to: string) =>
	apiFetch<{ data: { changed: number } }>(API_ENDPOINTS.ADMIN.TAG_MERGE(), { method: 'POST', body: { from, to } }).then(
		(r) => r.data,
	);
/** 태그 지우기: 바꾼 뉴스레터 수 */
export const removeTag = (tag: string) =>
	apiFetch<{ data: { changed: number } }>(API_ENDPOINTS.ADMIN.TAG_REMOVE(), { method: 'POST', body: { tag } }).then(
		(r) => r.data,
	);
export const deleteTagRule = (id: number) => apiFetch(API_ENDPOINTS.ADMIN.TAG_RULE(id), { method: 'DELETE' });

// ---- 통계 (query: from · to 등) ----
export const fetchSubscriberStats = (query: string) =>
	data<SubscriberStats>(API_ENDPOINTS.ADMIN.STATS('subscribers', query));
export const fetchCostStats = (query: string) => data<CostStats>(API_ENDPOINTS.ADMIN.STATS('cost', query));
export const fetchTrafficStats = (query: string) => data<TrafficStats>(API_ENDPOINTS.ADMIN.STATS('traffic', query));
export const fetchDeliveryStats = (query: string) => data<DeliveryStats>(API_ENDPOINTS.ADMIN.STATS('delivery', query));
export const fetchTasteStats = () => data<TasteStats>(API_ENDPOINTS.ADMIN.STATS('taste', ''));
export const fetchPageStats = (query: string) => data<PageStats>(API_ENDPOINTS.ADMIN.STATS('page', query));
