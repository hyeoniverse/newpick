'use client';

import Img from 'next/image';
import { FcGoogle } from 'react-icons/fc';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

interface Step {
	title: string;
	text: string;
	/** 없으면 화면 모양을 그린 LoginMock을 보여 준다 */
	image?: string;
	alt?: string;
	/** 원본 크기: 그림이 늦게 로드돼도 자리를 미리 잡아 줄이 밀리지 않게 (스크롤 진행도가 어긋나지 않는다) */
	size?: [number, number];
	/** 공개 화면과 마이페이지를 함께 보여 줄 때: 이름표를 단 사진 여러 장을 따로 놓는다 (image 대신) */
	pair?: Shot[];
}

interface Shot {
	label: string;
	image: string;
	alt: string;
	size: [number, number];
}

const STEPS: Step[] = [
	{
		title: '구글로 로그인',
		text: '구글 계정으로 바로 시작해요. 따로 가입 양식을 채울 필요가 없어요.',
	},
	{
		title: '관심사 고르기',
		text: 'IT · 정치 · 경제 · 사회 · 생활 · 세계, 다양한 분야의 뉴스 가운데 중요한 것만 골라 보내 드려요. 놓치고 싶지 않은 소식을 매일 아침 메일 한 통으로 받아 보세요.',
		image: '/img/about_categories.jpg',
		size: [1390, 334],
		alt: '관심사를 고르는 화면',
	},
	{
		title: '구독 완료',
		text: '다음 날 아침부터 뉴스레터가 도착해요. 관심사는 마이페이지에서 언제든 바꿀 수 있어요.',
		image: '/img/about_sns-login.jpg',
		size: [1534, 756],
		alt: '구독 설정이 완료되었다는 안내',
	},
	// 4~8: 같은 예시(기준금리 동결 → 예금금리 인하 → 연내 인하 신호)로 이어지는 화면
	{
		title: '북마크',
		text: '다시 보고 싶은 뉴스레터는 북마크해 두세요. 북마크한 뉴스레터는 마이페이지에 모이고, 폴더로 정리할 수 있어요.',
		pair: [
			{
				label: '뉴스레터',
				image: '/img/about_how-bookmark-news.jpg',
				size: [2240, 600],
				alt: '뉴스레터 제목 옆 북마크 단추가 켜진 화면',
			},
			{
				label: '마이페이지 북마크',
				image: '/img/about_how-bookmark-mypage.jpg',
				size: [2080, 808],
				alt: '마이페이지 북마크를 금리 폴더로 거른 화면',
			},
		],
	},
	{
		title: '스크랩 · 메모',
		text: '읽다가 중요한 문장은 드래그해 스크랩하거나 메모를 남겨 보세요. 스크랩한 문장은 마이페이지에 차곡차곡 쌓이고, 폴더로 정리할 수 있어요.',
		pair: [
			{
				label: '뉴스레터',
				image: '/img/about_how-scrap-news.jpg',
				size: [2240, 1048],
				alt: '본문 문장을 골라 스크랩 · 메모 도구가 뜬 화면',
			},
			{
				label: '마이페이지 스크랩',
				image: '/img/about_how-scrap-mypage.jpg',
				size: [2080, 1336],
				alt: '마이페이지 스크랩에 소식별로 모인 문장 · 메모 · 폴더',
			},
		],
	},
	{
		title: '후속 지켜보기',
		text: "각 소식의 관전 포인트에서 '후속 지켜보기'를 켜면 이어지는 새 소식을 메일로 알려 드려요. 마이페이지에서도 확인하고 관리할 수 있어요.",
		pair: [
			{
				label: '뉴스레터',
				image: '/img/about_how-5-public.jpg',
				size: [2240, 780],
				alt: "관전 포인트 옆 '지켜보는 중' 단추",
			},
			{
				label: '마이페이지 지켜보기',
				image: '/img/about_how-5-mypage.jpg',
				size: [2080, 870],
				alt: '지켜보는 소식과 이어진 새 소식',
			},
		],
	},
	{
		title: '태그 팔로우',
		text: '관심 있는 태그를 팔로우하면 그 태그의 새 소식을 메일로 따로 모아 보내 드려요. 받은 소식은 모두 마이페이지에 시간순으로 모여요.',
		pair: [
			{
				label: '태그 목록',
				image: '/img/about_how-6-public.jpg',
				size: [2080, 978],
				alt: '태그로 거른 뉴스레터 목록과 팔로우한 태그',
			},
			{
				label: '마이페이지 지켜보기',
				image: '/img/about_how-6-mypage.jpg',
				size: [2080, 1144],
				alt: '팔로우한 태그의 소식이 시간순으로 쌓인 카드',
			},
		],
	},
	{
		title: '맞춤형 뉴스레터 받기',
		text: '매일 아침 8시 40분, 출근길에 메일함을 열면 오늘 꼭 알아야 할 소식이 한 통으로 정리돼 있어요. 북마크 · 스크랩, 지켜보는 소식, 팔로우한 태그를 엮어 맞춤 브리핑부터 후속 소식까지 나에게 맞춰 써 드려요. 지난 소식은 마이페이지에서 언제든 다시 볼 수 있어요.',
		image: '/img/about_how-7-mail.jpg',
		size: [1280, 2000],
		alt: '맞춤 브리핑 · 지켜보던 소식의 후속 · 팔로우한 태그가 담긴 맞춤 메일',
	},
];

/** 앞 세 단계(시작: 세 번의 클릭)와 뒤 다섯 단계(읽은 뒤의 흐름: 북마크 → 스크랩 · 메모 → 후속 지켜보기 → 태그 팔로우 → 맞춤형 뉴스레터 받기) 사이에 두 번째 제목을 둔다 */
const FIRST_PART = 3;

/** 로그인 단계는 캡처가 없어 로그인 창 모양을 그린다 (장식) */
function LoginMock() {
	return (
		<div className="login-mock">
			<span className="mock-logo">NP</span>
			<p className="mock-title">로그인하고 내 관심사 뉴스 받기</p>
			<span className="mock-google">
				<FcGoogle /> Google로 계속하기
			</span>
			<p className="mock-terms">이용약관 · 개인정보 처리방침</p>
		</div>
	);
}

/** 한 단계: 그림은 화면 끝까지 닿고, 스크롤하면 자기 쪽 끝에서 밀려 들어온다 (--progress 0 → 1). 줄 높이가 달라도 가운데에 왔을 때 끝나게 center */
function StepRow({ step, index }: { step: Step; index: number }) {
	const ref = useScrollProgress<HTMLLIElement>('center');

	return (
		<li ref={ref} className={index % 2 === 0 ? 'row' : 'row reverse'}>
			<div className="copy">
				<span className="no">{String(index + 1).padStart(2, '0')}</span>
				<h3>{step.title}</h3>
				<p>{step.text}</p>
			</div>
			{step.pair ? (
				<div className="shots">
					{step.pair.map((shot) => (
						<figure key={shot.image} className="shot">
							<figcaption>{shot.label}</figcaption>
							<Img
								src={shot.image}
								alt={shot.alt}
								width={shot.size[0]}
								height={shot.size[1]}
								sizes="(max-width: 1023px) 100vw, 60vw"
							/>
						</figure>
					))}
				</div>
			) : (
				<div className="shot">
					{step.image ? (
						<Img
							src={step.image}
							alt={step.alt ?? ''}
							width={step.size?.[0] ?? 0}
							height={step.size?.[1] ?? 0}
							sizes="(max-width: 1023px) 100vw, 60vw"
						/>
					) : (
						<LoginMock />
					)}
				</div>
			)}
		</li>
	);
}

/**
 * HOW TO USE: 화면 폭을 꽉 채우는 지그재그. 단계마다 그림이 왼쪽 끝 → 오른쪽 끝을 번갈아 차지한다.
 * 줄을 화면 폭(100vw)으로 넓히고, 스크롤바 폭만큼 넘치는 부분은 시작하기 페이지의 body overflow-x: clip이 자른다
 * (예전에는 그림을 페이지 밖까지 밀어 두어 가로 스크롤이 생겼다)
 */
export default function HowToUseSection() {
	return (
		<section className="np-about-how-to-use-section-how-to-use" data-track-section="about-how-to-use">
			<SectionHeading
				label="HOW TO USE"
				title="세 번의 클릭으로, 간단하게 시작"
				sub="간편하게 로그인하고 원하는 분야를 고르세요. 매일 아침 출근 전, 간밤에 놓친 중요한 소식과 아침 속보까지 한 통으로 받아 볼 수 있어요."
			/>
			<ol className="rows">
				{STEPS.slice(0, FIRST_PART).map((step, i) => (
					<StepRow key={step.title} step={step} index={i} />
				))}
			</ol>
			{/* 받은 뒤의 흐름: 뒤 다섯 단계 앞에 두 번째 제목 */}
			<div className="mid">
				<h3 className="mid-title">유기적으로 이어지는 흐름</h3>
				<p className="mid-sub">
					한 번 읽고 끝나지 않아요. 북마크와 스크랩으로 중요한 내용을 저장하고, 후속 뉴스 지켜보기와 태그 팔로우로
					나에게 맞춘 뉴스레터를 받아 보세요.
				</p>
			</div>
			<ol className="rows">
				{STEPS.slice(FIRST_PART).map((step, i) => (
					<StepRow key={step.title} step={step} index={FIRST_PART + i} />
				))}
			</ol>
		</section>
	);
}
