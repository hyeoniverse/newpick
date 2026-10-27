import { timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { NEWSLETTER_CACHE_TAG, REVALIDATE_HEADER } from '@/constants/cache';

/** 길이가 달라도 시간 차이로 값을 알 수 없게 비교한다 */
function sameSecret(given: string | null, expected: string) {
	if (!given) return false;
	const a = Buffer.from(given);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * 사이트 캐시 비우기 (#73). API 서버만 부른다 (관리자 버튼도 API를 거쳐 온다).
 * - 뉴스레터 꼬리표가 붙은 조회(트렌드 · 상세 확인)를 비우고
 * - 첫 화면처럼 미리 만들어 둔 페이지를 모두 다음 요청에서 다시 만들게 한다
 * next.config의 /api/* 프록시보다 이 파일 라우트가 먼저 잡힌다
 */
export async function POST(request: Request) {
	const secret = process.env.REVALIDATE_SECRET;
	if (!secret) {
		return NextResponse.json(
			{ statusCode: 503, code: 'SITE_CACHE_UNAVAILABLE', message: 'REVALIDATE_SECRET이 설정되지 않았습니다.' },
			{ status: 503 },
		);
	}
	if (!sameSecret(request.headers.get(REVALIDATE_HEADER), secret)) {
		return NextResponse.json(
			{ statusCode: 401, code: 'UNAUTHORIZED', message: '캐시를 비울 권한이 없습니다.' },
			{ status: 401 },
		);
	}

	revalidateTag(NEWSLETTER_CACHE_TAG);
	revalidatePath('/', 'layout');
	return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
