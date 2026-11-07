import BrandAvatar from '@/components/common/BrandAvatar';
import { cx } from '@/styles/tw';

interface Props {
	subject: string;
	/** 실제 메일 HTML */
	html: string;
	/** iframe 이름 (화면 읽기용) */
	title?: string;
	className?: string;
}

/**
 * 받은편지함에서 연 메일 모양 (공통, 체험하기에서 시작): 보낸 사람 · 제목 줄 + 메일 본문.
 * 본문은 실제 메일 HTML을 iframe에 넣어 사이트 스타일과 섞이지 않게. 스크립트는 막고, 링크는 새 탭으로 연다.
 * 메일 앱처럼 본문은 라이트 그대로 (메일 HTML이 배경색을 갖고 있다)
 */
export default function MailView({ subject, html, title = '메일 본문', className }: Props) {
	return (
		<article className={cx('flex min-h-0 flex-1 flex-col gap-3', className)}>
			<header className="mail-head flex shrink-0 items-center gap-3">
				<BrandAvatar />
				<div>
					<p className="from m-0 text-extra-small text-sub-text">뉴픽 NewPick</p>
					<h3 className="subject mx-0 mt-0.5 mb-0 text-medium font-bold leading-[1.4] text-text [word-break:keep-all]">
						{subject}
					</h3>
				</div>
			</header>
			<iframe
				className="mail-body min-h-0 w-full flex-1 rounded-[8px] border-none"
				title={title}
				srcDoc={html}
				sandbox="allow-popups allow-popups-to-escape-sandbox"
			/>
		</article>
	);
}
