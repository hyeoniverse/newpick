import { useCallback, useState } from 'react';

/**
 * 고른 · 펼친 항목 모음 (#230): 누르면 넣고 다시 누르면 빼는 Set 상태.
 * 매번 새 Set을 만들어 바꾸므로 화면이 다시 그려진다
 */
export function useToggleSet<T>() {
	const [set, setSet] = useState<Set<T>>(() => new Set());

	/** 있으면 빼고 없으면 넣기 */
	const toggle = useCallback(
		(item: T) =>
			setSet((prev) => {
				const next = new Set(prev);
				if (next.has(item)) next.delete(item);
				else next.add(item);
				return next;
			}),
		[],
	);
	/** 넣기 (이미 있으면 그대로) */
	const add = useCallback((item: T) => setSet((prev) => (prev.has(item) ? prev : new Set(prev).add(item))), []);
	/** 여럿을 한꺼번에 넣거나(on) 빼기 (예: 보이는 것 모두 선택 · 해제) */
	const setMany = useCallback(
		(items: Iterable<T>, on: boolean) =>
			setSet((prev) => {
				const next = new Set(prev);
				for (const item of items) {
					if (on) next.add(item);
					else next.delete(item);
				}
				return next;
			}),
		[],
	);
	/** 모두 비우기 */
	const clear = useCallback(() => setSet(new Set()), []);

	return { set, toggle, add, setMany, clear };
}
