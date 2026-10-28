import type { Metadata } from 'next';
import { pageMetadata } from '@/constants/site';
import TagIndex from '@/app/tags/_components/TagIndex';

export const metadata: Metadata = pageMetadata(
	'태그',
	'뉴픽 뉴스레터에 붙은 태그를 관심사별로 모아 봅니다. 태그를 누르면 그 태그가 붙은 뉴스레터를 볼 수 있어요.',
	'/tags',
);

/** 태그 전체 (#20). 목록의 태그 줄은 최근 자주 나온 것만 보이므로, 나머지는 여기서 */
export default function Page() {
	return <TagIndex />;
}
