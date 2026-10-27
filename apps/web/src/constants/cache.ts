/**
 * 사이트 캐시 (#73). 뉴스레터를 서버에서 읽을 때 이 꼬리표를 붙이고,
 * API가 뉴스레터를 만들거나 지우면 /api/revalidate로 꼬리표와 페이지 캐시를 한 번에 비운다
 */
export const NEWSLETTER_CACHE_TAG = 'newsletters';

/** API가 캐시를 비울 때 보내는 비밀 값 헤더 (apps/api/src/site-cache와 같은 이름) */
export const REVALIDATE_HEADER = 'x-revalidate-secret';
