import { Fragment } from 'react';

interface Props {
	text: string;
	/** 검색어. 띄어쓴 낱말(2글자 이상)마다 강조 */
	query?: string;
}

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 검색 결과에서 검색어와 같은 부분을 <mark>로 (#20) */
export default function Highlight({ text, query }: Props) {
	const words = (query ?? '')
		.split(/\s+/)
		.filter((word) => [...word].length >= 2)
		.map(escape);
	if (!words.length) return <>{text}</>;

	const pattern = new RegExp(`(${words.join('|')})`, 'gi');
	return (
		<>
			{text.split(pattern).map((part, index) =>
				index % 2 === 1 ? <mark key={index}>{part}</mark> : <Fragment key={index}>{part}</Fragment>,
			)}
		</>
	);
}
