import { create } from 'zustand';

/**
 * 떠 있는 단추(위 · 아래 스크롤, 휴대폰 북마크 · 링크)의 공용 상태.
 * 휴대폰에서 아래 시트가 열려 있는 동안은 시트와 겹치지 않게 단추를 잠깐 숨긴다 (사라질 때 쓰던 애니메이션 그대로)
 */
interface FloatState {
	sheetOpen: boolean;
	setSheetOpen: (open: boolean) => void;
}

export const useFloatStore = create<FloatState>((set) => ({
	sheetOpen: false,
	setSheetOpen: (open) => set({ sheetOpen: open }),
}));
