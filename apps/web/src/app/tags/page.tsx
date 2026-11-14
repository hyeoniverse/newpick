import { META } from '@/copy';
import { ROUTES } from '@/constants/routes';
import type { Metadata } from 'next';
import { pageMetadata } from '@/constants/site';
import TagIndex from '@/app/tags/_components/TagIndex';

export const metadata: Metadata = pageMetadata('태그', META.tags, ROUTES.tags);

/** 태그 전체 (#20). 목록의 태그 줄은 최근 자주 나온 것만 보이므로, 나머지는 여기서 */
export default function Page() {
	return <TagIndex />;
}
