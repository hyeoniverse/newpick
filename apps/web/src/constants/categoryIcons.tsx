import { LuCoffee, LuCpu, LuGlobe, LuLandmark, LuNewspaper, LuTrendingUp, LuUsers } from 'react-icons/lu';

/** 분야 아이콘 (분야 이름 → 아이콘). 뉴스 화면 배너 · 홈 '오늘의 뉴스레터' 준비 중 자리 */
export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
	전체: <LuNewspaper />,
	IT: <LuCpu />,
	정치: <LuLandmark />,
	경제: <LuTrendingUp />,
	사회: <LuUsers />,
	생활: <LuCoffee />,
	세계: <LuGlobe />,
};
