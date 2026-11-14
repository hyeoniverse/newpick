/** 폴더 */
export const FOLDERS = {
	removed: {
		keep: '폴더를 삭제했습니다. 안에 있던 항목은 폴더 없음으로 옮겼습니다.',
		delete: '폴더와 안에 있던 항목을 삭제했습니다.',
		move: '폴더를 삭제하고 안에 있던 항목을 옮겼습니다.',
	},
	renamed: '폴더 이름을 바꿨습니다.',
	deleteTitle: (name: string) => `'${name}' 폴더를 삭제하시겠습니까?`,
	emptyFolder: '빈 폴더입니다.',
	inside: (items: string) => `안에 ${items}가 있습니다.\n안의 항목을 어떻게 처리할지 선택해 주십시오.`,
	erase: (items: string) => `${items}를 삭제합니다. 되돌릴 수 없습니다.`,
	mailsKept: '받은 메일은 삭제할 수 없어 폴더 없음으로 옮겨집니다.',
	createFirst: '먼저 ‘새 폴더’로 폴더를 만들어 주십시오.',
};
