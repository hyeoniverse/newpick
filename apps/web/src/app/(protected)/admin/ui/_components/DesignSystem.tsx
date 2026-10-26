'use client';

import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { LuArrowLeft, LuArrowRight, LuBell, LuMailCheck, LuShare2, LuSparkles } from 'react-icons/lu';

import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { useInputCheck } from '@/hooks/useInputCheck';
import { ToastPosition, ToastType } from '@/models/toast.model';
import {
	ButtonScheme,
	ButtonSize,
	ColorKey,
	darkTheme,
	FontSize,
	FontWeight,
	HeadingSize,
	lightTheme,
	Theme,
} from '@/styles/theme';

import Button from '@/components/common/Button';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import InputText from '@/components/common/InputText';
import InputCheck from '@/components/common/InputCheck';
import InputSelect from '@/components/common/InputSelect';
import InputDate from '@/components/common/InputDate';
import InputRadio from '@/components/common/InputRadio';
import Spinner from '@/components/common/loader/Spinner';
import Skeleton from '@/components/common/loader/Skeleton';
import ModalContent from '@/components/common/modal/ModalContent';
import BarHeight from '@/components/common/BarHeight';
import BarWidth from '@/components/common/BarWidth';
import NoContentsPage from '@/components/common/NoContentsPage';
import AgreementCheck from '@/components/common/article/AgreementCheck';
import SubscribeInduce from '@/components/common/article/SubscribeInduce';
import CustomIcon from '@/components/common/icons/CustomIcon';
import BookmarkToggle from '@/components/common/icons/BookmarkToggle';
import OrigLinkIcon from '@/components/common/icons/OrigLinkIcon';
import LinkCopyIcon from '@/components/common/icons/LinkCopyIcon';
import ExternalLink from '@/components/common/ExternalLink';
import MoveButton from '@/components/common/MoveButton';
import TabNavigation from '@/components/common/TabNavgation';
import Logo from '@/components/common/Logo';
import Image from '@/components/common/Image';
import SummaryTextBox from '@/components/common/article/SummaryTextBox';
import Card from '@/components/common/Card';
import BorderTitle from '@/components/common/BorderTitle';
import CategoryTags from '@/components/common/article/CategoryTags';
import Tags from '@/components/common/Tags';

const SIZES = ['extraSmall', 'small', 'medium', 'large', 'extraLarge'] as const;
const WEIGHTS: FontWeight[] = ['light', 'regular', 'medium', 'semiBold', 'bold', 'extraBold'];
const SCHEMES: ButtonScheme[] = ['primary', 'secondary', 'outline', 'mono', 'monoOutline', 'danger', 'default'];
const TOAST_TYPES: ToastType[] = ['info', 'success', 'warning', 'error'];
const TOAST_POSITIONS: ToastPosition[] = [
	'center-top',
	'top-left',
	'top-right',
	'center-bottom',
	'bottom-left',
	'bottom-right',
];

const SECTIONS = [
	{ id: 'color', title: '색' },
	{ id: 'type', title: '글자' },
	{ id: 'shape', title: '모서리' },
	{ id: 'button', title: '버튼' },
	{ id: 'input', title: '입력' },
	{ id: 'feedback', title: '토스트 · 시트' },
	{ id: 'tag', title: '태그 · 칩' },
	{ id: 'card', title: '카드' },
	{ id: 'image', title: '이미지 · 로고' },
	{ id: 'nav', title: '탐색' },
	{ id: 'link', title: '링크 · 아이콘' },
	{ id: 'subscribe', title: '구독' },
	{ id: 'empty', title: '빈 화면 · 구분선' },
	{ id: 'loading', title: '로딩' },
];

/** 카드 예시 데이터 (실제 API를 부르지 않는다) */
const SAMPLE_CARD = {
	id: 'ds-card',
	image: '/img/newpick_default_img.jpg',
	header: 'IT',
	main: {
		title: '더존비즈온 침해사고, 정부 ‘중대’ 판단',
		description: 'PHP투쉘 취약점에는 정부가 패치 후 서비스 재시작 등 대응 지침을 냈다.',
		tags: ['더존비즈온', '침해사고', 'PHP투쉘'],
	},
	footer: '2026-10-27 | 조회수 34',
	url: '/articles',
};

const SAMPLE_TABS = [
	{ id: 1, title: '내 뉴스레터', link: 'ds-tab-1' },
	{ id: 2, title: '북마크한 뉴스레터', link: 'ds-tab-2' },
	{ id: 3, title: '뉴스레터 설정', link: 'ds-tab-3' },
];

/**
 * 디자인 시스템 확인 화면 (관리자). 테마 값과 공통 컴포넌트를 한곳에서 눌러 본다.
 * 값은 styles/theme.ts에서 바로 읽으므로 테마를 바꾸면 여기도 따라 바뀐다
 */
export default function DesignSystem() {
	const { user, session } = useAuth();

	if (!user) {
		return (
			<StyledGate>
				{session === 'out' ? <Text>로그인이 필요합니다.</Text> : <Spinner />}
			</StyledGate>
		);
	}
	if (user.role !== 'admin') {
		return (
			<StyledGate>
				<Text weight="semiBold">관리자만 볼 수 있는 화면입니다.</Text>
			</StyledGate>
		);
	}
	return <DesignSystemBody />;
}

function DesignSystemBody() {
	const theme = useTheme();
	const { showToast, setPosition, position } = useToast();
	const { openModal, closeModal } = useModal();
	const { isChecked } = useInputCheck('ds-check');
	const [selectValue, setSelectValue] = useState('');
	const [date, setDate] = useState<Date | null>(null);
	const [cycle, setCycle] = useState<'daily' | 'weekly'>('daily');
	const [bookmarked, setBookmarked] = useState(false);

	return (
		<StyledPage>
			<header className="page-head">
				<Title size="small" weight="bold">
					디자인 시스템
				</Title>
				<Text size="small" color="subText">
					지금 테마: {theme.name === 'dark' ? '다크' : '라이트'} · 오른쪽 위 해/달 버튼으로 바꿔 보세요
				</Text>
				<nav className="toc" aria-label="목차">
					{SECTIONS.map((s) => (
						<a key={s.id} href={`#${s.id}`}>
							{s.title}
						</a>
					))}
				</nav>
			</header>

			<Section id="color" title="색" note="theme.color — 라이트·다크 나란히">
				<div className="swatches">
					{(Object.keys(lightTheme.color) as ColorKey[]).map((key) => (
						<div key={key} className="swatch">
							<div className="chips">
								<Chip $color={lightTheme.color[key]} title="라이트" />
								<Chip $color={darkTheme.color[key]} title="다크" />
							</div>
							<code>{key}</code>
							<span className="hex">
								{lightTheme.color[key]} / {darkTheme.color[key]}
							</span>
						</div>
					))}
				</div>
			</Section>

			<Section id="type" title="글자" note="Title(heading) · Text(fontSize) · fontWeight">
				<div className="stack">
					{(SIZES as readonly HeadingSize[])
						.slice()
						.reverse()
						.map((size) => (
							<div key={size} className="row">
								<code>Title {size}</code>
								<Title size={size} weight="bold">
									뉴스를 새롭게 고르다
								</Title>
								<span className="hex">{theme.heading[size].fontSize}</span>
							</div>
						))}
					<hr />
					{(SIZES as readonly FontSize[]).map((size) => (
						<div key={size} className="row">
							<code>Text {size}</code>
							<Text size={size}>오늘 꼭 알아야 할 소식만 골라 보내드려요.</Text>
							<span className="hex">{theme.fontSize[size]}</span>
						</div>
					))}
					<hr />
					{WEIGHTS.map((weight) => (
						<div key={weight} className="row">
							<code>{weight}</code>
							<Text weight={weight}>가나다 NewPick 2026</Text>
							<span className="hex">{theme.fontWeight[weight]}</span>
						</div>
					))}
				</div>
			</Section>

			<Section id="shape" title="모서리" note="theme.radius(쓰임새별) · theme.borderRadius(값)">
				<div className="radii">
					{(
						[
							['control', '누르는 것', '버튼·입력칸·선택 목록'],
							['chip', '분류·고르기', '태그·분야 칩·꼬리표'],
							['surface', '담는 것', '카드·사진·펼친 목록'],
							['floating', '뜨는 것', '시트·토스트'],
						] as const
					).map(([role, name, examples]) => (
						<div key={role} className="radius">
							<Box $radius={theme.radius[role]} />
							<code>radius.{role}</code>
							<span className="hex">
								{name} · {theme.radius[role]}
							</span>
							<span className="hex">{examples}</span>
						</div>
					))}
				</div>
				<hr className="divider" />
				<div className="radii">
					{(Object.keys(theme.borderRadius) as (keyof Theme['borderRadius'])[]).map((key) => (
						<div key={key} className="radius">
							<Box $radius={theme.borderRadius[key]} />
							<code>{key}</code>
							<span className="hex">{theme.borderRadius[key]}</span>
						</div>
					))}
				</div>
			</Section>

			<Section id="button" title="버튼" note="scheme × size, 비활성 · 로딩 · 아이콘">
				<div className="table-scroll">
					<table className="matrix">
						<thead>
							<tr>
								<th />
								{SIZES.map((size) => (
									<th key={size}>
										<code>{size}</code>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{SCHEMES.map((scheme) => (
								<tr key={scheme}>
									<th>
										<code>{scheme}</code>
									</th>
									{(SIZES as readonly ButtonSize[]).map((size) => (
										<td key={size}>
											<Button scheme={scheme} size={size}>
												구독하기
											</Button>
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="wrap">
					<Button scheme="primary" disabled>
						비활성
					</Button>
					<Button scheme="primary" isLoading>
						로딩
					</Button>
					<Button scheme="outline" icon={<LuBell />} iconPosition="left">
						아이콘 왼쪽
					</Button>
					<Button scheme="outline" icon={<LuSparkles />} iconPosition="right">
						아이콘 오른쪽
					</Button>
				</div>
			</Section>

			<Section id="input" title="입력" note="InputText · InputCheck · InputRadio · InputSelect · InputDate">
				<div className="grid">
					<InputText label="이메일" placeholder="name@example.com" inputType="email" />
					<InputSelect
						name="ds-select"
						label="분야"
						value={selectValue}
						onChange={setSelectValue}
						placeholder="분야를 고르세요"
						options={[
							{ label: 'IT', value: 'IT' },
							{ label: '경제', value: '경제' },
							{ label: '세계', value: '세계' },
						]}
					/>
					<InputDate label="날짜" onChange={setDate} />
					<InputRadio
						name="ds-cycle"
						label="발송 주기"
						value={cycle}
						onChange={setCycle}
						options={[
							{ label: '매일', value: 'daily' },
							{ label: '매주', value: 'weekly' },
						]}
					/>
					<div className="check">
						<InputCheck name="ds-check" label="약관에 동의합니다" />
					</div>
				</div>
				<Text size="extraSmall" color="subText">
					값: 분야 {selectValue || '없음'} · 날짜 {date?.toLocaleDateString('ko-KR') ?? '없음'} · 체크{' '}
					{isChecked ? '됨' : '안 됨'} · 주기 {cycle === 'daily' ? '매일' : '매주'}
				</Text>
			</Section>

			<Section id="feedback" title="토스트 · 시트" note="useToast · useModal (모든 모달은 아래에서 올라오는 시트)">
				<div className="wrap">
					{TOAST_TYPES.map((type) => (
						<Button
							key={type}
							scheme="outline"
							size="small"
							onClick={() => showToast(`${type} 토스트입니다. 마우스를 올리면 멈춥니다.`, type)}
						>
							토스트 {type}
						</Button>
					))}
				</div>
				<InputRadio
					name="ds-toast-position"
					label="위치"
					value={position}
					onChange={setPosition}
					options={TOAST_POSITIONS.map((p) => ({ label: p, value: p }))}
				/>
				<div className="wrap">
					<Button
						scheme="primary"
						size="small"
						onClick={() =>
							openModal(
								<ModalContent
									icon={<LuMailCheck />}
									title="구독이 시작되었습니다."
									content="내일 아침 8시 40분에 첫 메일이 도착해요."
									outlineButton="닫기"
									filledButton="확인"
									onCancelClick={closeModal}
									onConfirmClick={closeModal}
								/>,
							)
						}
					>
						기본 시트 (small)
					</Button>
					<Button
						scheme="secondary"
						size="small"
						onClick={() =>
							openModal(
								<div className="ds-large">
									<Title size="extraSmall" weight="bold">
										넓은 시트 (large)
									</Title>
									<Text size="small" color="subText">
										핸들을 끌어 내리거나, 바깥을 누르거나, Esc로 닫습니다.
									</Text>
									<Skeleton />
								</div>,
								{ size: 'large' },
							)
						}
					>
						넓은 시트 (large)
					</Button>
				</div>
			</Section>

			<Section id="tag" title="태그 · 칩" note="Tags(키워드) · CategoryTags(분야) · BorderTitle">
				<Tags tags={['코스피', '빅테크 실적', '가상자산 과세', 'FOMC']} />
				<CategoryTags />
				<BorderTitle text="전체" color="primary" />
			</Section>

			<Section id="card" title="카드" note="Card type: main · list · sub, SummaryTextBox (예시 데이터, API 호출 없음)">
				<Card type="main" data={SAMPLE_CARD} />
				<div className="grid">
					<Card type="list" data={SAMPLE_CARD} />
					<Card type="sub" data={SAMPLE_CARD} />
				</div>
				<SummaryTextBox>
					26일 코스피가 외국인 순매도와 AI 수익성 우려로 5469.47에 마감해 종가 기준 4월 6일 이후 최저를 기록했다.
				</SummaryTextBox>
			</Section>

			<Section id="image" title="이미지 · 로고" note="Image ratio: square · wide · tall, Logo">
				<div className="images">
					{(['square', 'wide', 'tall'] as const).map((ratio) => (
						<div key={ratio} className="image">
							<Image src="/img/newpick_default_img.jpg" alt={ratio} ratio={ratio} />
							<code>{ratio}</code>
						</div>
					))}
				</div>
				<div className="wrap">
					<Logo />
					<Logo logoType="footer-logo" />
				</div>
			</Section>

			<Section id="nav" title="탐색" note="TabNavigation · MoveButton">
				<TabNavigation tabs={SAMPLE_TABS} />
				<div className="wrap">
					<MoveButton text="목록으로" frontIcon={<LuArrowLeft />} />
					<MoveButton text="다음 글" backIcon={<LuArrowRight />} />
					<MoveButton text="비활성" disabled />
				</div>
				<Text size="extraSmall" color="subText">
					Dropdown은 헤더(프로필 메뉴·모바일 메뉴) 위치에 맞춰진 컴포넌트라, 헤더의 프로필 사진을 눌러 확인하세요.
				</Text>
			</Section>

			<Section id="link" title="링크 · 아이콘" note="ExternalLink(바깥 링크) · LinkCopyIcon · OrigLinkIcon · CustomIcon · BookmarkToggle">
				<Text size="small">
					<ExternalLink href="https://kopico.go.kr">kopico.go.kr</ExternalLink> — 마우스를 올리면 화살표가 움직입니다
				</Text>
				<div className="wrap">
					<LinkCopyIcon id="ds" />
					<OrigLinkIcon />
					<CustomIcon label="공유" onClick={() => showToast('아이콘을 눌렀습니다.', 'info')}>
						<LuShare2 />
					</CustomIcon>
				</div>
				<div className="wrap">
					<BookmarkToggle pressed={bookmarked} onToggle={() => setBookmarked((v) => !v)} />
					<Text size="extraSmall" color="subText">
						BookmarkToggle — BookmarkIcon의 모양만. 여기서는 눌러도 저장하지 않습니다 (BookmarkIcon은 뉴스레터 id로 API를 부름)
					</Text>
				</div>
			</Section>

			<Section id="subscribe" title="구독" note="SubscribeInduce(기사 하단) · AgreementCheck">
				<SubscribeInduce />
				<AgreementCheck name="ds-agreement" />
			</Section>

			<Section id="empty" title="빈 화면 · 구분선" note="NoContentsPage · BarWidth · BarHeight">
				<NoContentsPage text="북마크한 뉴스레터가 없습니다." btnText="뉴스레터 보러 가기" moveTo="/articles" />
				<BarWidth />
				<div className="wrap">
					<Text size="small">왼쪽</Text>
					<BarHeight height="1rem" />
					<Text size="small">오른쪽</Text>
				</div>
			</Section>

			<Section id="loading" title="로딩" note="Spinner · Skeleton">
				<div className="wrap">
					<Spinner />
					<Spinner size="2rem" />
					<Spinner size="3rem" />
				</div>
				<Skeleton />
			</Section>
		</StyledPage>
	);
}

function Section({ id, title, note, children }: { id: string; title: string; note: string; children: React.ReactNode }) {
	return (
		<section id={id} className="section">
			<div className="section-head">
				<Title size="extraSmall" weight="bold">
					{title}
				</Title>
				<code>{note}</code>
			</div>
			{children}
		</section>
	);
}

const StyledGate = styled.div`
	display: flex;
	justify-content: center;
	padding: 6rem 1rem;
`;

const Chip = styled.span<{ $color: string }>`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	border: 1px solid ${({ theme }) => theme.color.border};
	background: ${({ $color }) => $color};
`;

/** 가로로 긴 상자: 정사각형이면 capsule(9999px)과 circle(50%)이 둘 다 원으로 보여 구분되지 않는다 */
const Box = styled.span<{ $radius: string }>`
	width: 6rem;
	height: 3rem;
	border-radius: ${({ $radius }) => $radius};
	background: ${({ theme }) => theme.color.tertiary};
	border: 2px solid ${({ theme }) => theme.color.primary};
`;

const StyledPage = styled.div`
	padding: 2.5rem 0 5rem;
	color: ${({ theme }) => theme.color.text};

	code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.8125rem;
		color: ${({ theme }) => theme.color.subText};
	}

	.hex {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.lightGrey};
	}

	.page-head {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	/* 목차: 스크롤해도 위에 붙어 있다 */
	.toc {
		position: sticky;
		top: 4rem;
		z-index: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0.5rem 0;
		background: ${({ theme }) => theme.color.background};

		a {
			padding: 0.25rem 0.75rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.borderRadius.capsule};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.text};

			&:hover {
				border-color: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 2rem 0;
		border-top: 1px solid ${({ theme }) => theme.color.border};
		scroll-margin-top: 7rem;
	}

	.section-head {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 1rem;
	}

	.swatch {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;

		.chips {
			display: flex;
			gap: 0.25rem;
		}
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		hr {
			width: 100%;
			border: none;
			border-top: 1px dashed ${({ theme }) => theme.color.border};
		}
	}

	.row {
		display: grid;
		grid-template-columns: 9rem 1fr auto;
		align-items: center;
		gap: 1rem;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}
	}

	.divider {
		width: 100%;
		border: none;
		border-top: 1px dashed ${({ theme }) => theme.color.border};
	}

	.radii {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.radius {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
	}

	.table-scroll {
		overflow-x: auto;
	}

	.matrix {
		border-collapse: collapse;

		th,
		td {
			padding: 0.5rem;
			text-align: left;
			vertical-align: middle;
			white-space: nowrap;
		}
	}

	.wrap {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.images {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 1rem;
	}

	.image {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 8rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		align-items: end;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 1fr;
		}
	}
`;
