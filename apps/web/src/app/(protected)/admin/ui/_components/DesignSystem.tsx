'use client';

import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { LuBell, LuMailCheck, LuSparkles } from 'react-icons/lu';

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
	{ id: 'loading', title: '로딩' },
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

			<Section id="shape" title="모서리" note="theme.borderRadius">
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
