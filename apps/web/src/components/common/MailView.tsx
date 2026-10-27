'use client';

import styled from 'styled-components';
import BrandAvatar from '@/components/common/BrandAvatar';

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
 * 본문은 실제 메일 HTML을 iframe에 넣어 사이트 스타일과 섞이지 않게. 스크립트는 막고, 링크는 새 탭으로 연다
 */
export default function MailView({ subject, html, title = '메일 본문', className }: Props) {
	return (
		<StyledMailView className={className}>
			<header className="mail-head">
				<BrandAvatar />
				<div>
					<p className="from">뉴픽 NewPick</p>
					<h3 className="subject">{subject}</h3>
				</div>
			</header>
			<iframe className="mail-body" title={title} srcDoc={html} sandbox="allow-popups allow-popups-to-escape-sandbox" />
		</StyledMailView>
	);
}

const StyledMailView = styled.article`
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;

	/* 받은편지함의 보낸 사람·제목 줄 */
	.mail-head {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;

		.from {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}

		.subject {
			margin: 0.125rem 0 0;
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			line-height: 1.4;
			color: ${({ theme }) => theme.color.text};
			word-break: keep-all;
		}
	}

	/* 메일 앱처럼 본문은 라이트 그대로 (메일 HTML이 배경색을 갖고 있다) */
	.mail-body {
		flex: 1;
		width: 100%;
		min-height: 0;
		border: none;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
	}
`;
