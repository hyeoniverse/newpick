/** 관리자 화면 */
export const ADMIN = {
	dashboardLoadFailed: '대시보드를 불러오지 못했습니다.',
	cache: {
		cleared: '사이트 캐시를 비웠습니다. 다음 접속부터 새 내용이 보입니다.',
		clearFailed: '사이트 캐시를 비우지 못했습니다.',
		lead: '첫 화면과 목록은 빠르게 띄우려고 최대 10분 동안 저장해 둔 내용을 보여 줍니다. 뉴스레터를 만들거나 지우면 자동으로 비워지며, DB를 직접 고쳤을 때는 여기서 바로 비울 수 있습니다.',
	},
	home: {
		designLead: '테마 값과 공통 컴포넌트를 한 화면에서 확인합니다.',
		cmsLead:
			'구독자 · AI 비용 · 발송 추이를 보고, 발행한 뉴스레터를 고치거나 지우고, 사용자 권한 · 구독자 · 관심사 현황을 보고, 갈라진 태그를 합칩니다.',
	},
	empty: {
		logs: '이 조건의 기록이 없습니다.',
		articles: '이 조건의 수집 기사가 없습니다.',
		jobRuns: '이 조건의 실행 기록이 없습니다.',
		newsletters: '이 기간에 발행한 뉴스레터가 없습니다.',
		mails: '이 기간에 보낸 메일이 없습니다.',
		mailsFor: (email: string) => `‘${email}’이(가) 포함된 수신자가 없습니다.`,
		periodLogs: '이 기간에 기록이 없습니다.',
		subscribers: '이 조건의 구독자가 없습니다.',
		users: '이 조건의 사용자가 없습니다.',
		tags: '이 조건의 태그가 없습니다.',
		pageStats: '이 기간 · 기기의 기록이 없습니다.',
		recipients: '기록이 없습니다.',
	},
	aiLogs: {
		rerunTitle: (date: string, category: string) => `${date} ${category} 뉴스레터를 다시 생성하시겠습니까?`,
		rerunBody:
			'그날 수집한 기사로 다시 요약해 그 날짜로 게시합니다. 이 관심사의 뉴스레터가 그날 이미 있으면 건너뜁니다. 구독 메일은 보내지 않으며, Claude 비용이 발생합니다.',
		rerunStarted: (date: string, category: string) =>
			`${date} ${category} 뉴스레터 생성을 시작했습니다. 몇 분 후 기록에 표시됩니다.`,
	},
	articlesSummary: (total: string) => `${total}건 · 원문은 수집 후 30일이 지나면 삭제됩니다`,
	categoriesLead:
		'관심사 이름은 수집(네이버 섹션) · 화면 · 메일과 연결되어 있어 여기서는 볼 수만 있습니다. 이름을 바꾸려면 코드도 함께 고쳐야 합니다.',
	jobs: {
		crawlWarning: '지금 언론사 기사를 수집합니다. 분야가 없는 기사는 Claude로 분류하므로 비용이 조금 발생합니다.',
		summaryWarning:
			'생성에 실패한 분야의 뉴스레터를 다시 시도합니다. 생성에 성공한 항목을 제외하고, 실패한 항목만 재시도하며, Claude 비용이 발생합니다.',
		mailWarning:
			'모든 구독자에게 오늘 뉴스레터를 지금 발송합니다. 이미 발송했다면 구독자가 같은 메일을 한 번 더 받게 됩니다.',
		recipientsFailed: '받은 사람을 불러오지 못했습니다.',
		scheduleSaved: '예약 시간을 바꿨습니다. 다음 실행부터 적용됩니다.',
		enabled: (job: string) => `${job}을 켰습니다.`,
		disabled: (job: string) => `${job}을 껐습니다. 서버를 다시 시작하면 다시 켜집니다.`,
		fillStarted: (date: string) => `${date} 누락된 뉴스레터 생성을 시작했습니다. 관심사당 1~2분 소요됩니다.`,
		runTitle: (job: string) => `${job}을 지금 실행하시겠습니까?`,
		runStarted: (job: string) => `${job}을 시작했습니다.`,
		autoOff: '이 서버는 예약 시각에 자동으로 실행되지 않습니다. 필요할 때 ‘지금 실행’을 눌러 주십시오.',
		noRunsYet: '아직 실행 기록이 없습니다',
		toggleNote:
			'켜기 · 끄기 상태는 서버 메모리에만 저장되므로 서버를 다시 시작하면 다시 켜집니다. 예약 시간과 실행 기록은 유지됩니다.',
		checking: '확인 중입니다.',
		allDone: '모든 분야가 이미 생성되어 대상이 없습니다.',
		fillBody:
			'선택한 날짜에 수집된 기사로, 그날 발행되지 않은 관심사의 뉴스레터를 생성해 해당 날짜로 게시합니다. 구독 메일은 발송하지 않으며, Claude 비용이 발생합니다.',
	},
	edit: {
		required: '제목과 요약은 비울 수 없습니다.',
		saved: '저장했습니다. 상세 페이지와 이후 메일에 반영됩니다.',
		failed: '처리하지 못했습니다.',
		resetTitle: '조회수를 0으로 되돌리시겠습니까?',
		resetBody: '인기 순위에서 이 뉴스레터가 아래로 내려갑니다.',
		resetDone: '조회수를 0으로 되돌렸습니다.',
		rewriteTitle: 'AI로 다시 작성하시겠습니까?',
		rewriteBody:
			'이 뉴스레터가 발행된 날 수집된 기사로 내용을 새로 작성합니다. 주소 · 발행일 · 조회수 · 북마크는 유지되며, 직접 수정한 내용은 사라집니다. 스크랩한 문장이 새 본문에 없으면 위치를 찾지 못할 수 있습니다. Claude 비용이 발생하며 1~2분 소요됩니다.',
		rewriteStarted: '다시 작성을 시작했습니다. 1~2분 후 새로고침하면 변경된 내용이 표시됩니다.',
		deleteTitle: '이 뉴스레터를 삭제하시겠습니까?',
		deleteBody: '상세 페이지 · 목록에서 사라지고 북마크 · 발송 기록도 함께 삭제됩니다. 되돌릴 수 없습니다.',
		htmlNote: '저장할 때 뉴스레터 템플릿에서 쓰는 태그 · class만 남기고 script와 이벤트 속성은 제거합니다.',
	},
	pageStatsSample: (path: string) =>
		`${path} 을 지금 모습으로 띄웠습니다. 내용이 바뀐 페이지는 위치가 조금 어긋날 수 있습니다.`,
	schedule: {
		order: '기사 수집 → AI 요약 → 구독 메일 순서가 되도록, 앞 작업보다 늦은 시각을 골라 주십시오.',
		lead: '기사 수집 → AI 요약 → 구독 메일 순서로 실행됩니다. 수집은 매시간 정한 분에 실행되고, 요약은 직전 24시간 동안 모은 기사로, 메일은 그날 요약으로 만들기 때문에 각 작업은 앞 작업보다 늦게 잡아야 합니다. 저장하면 바로 적용됩니다.',
	},
	stats: {
		referrerHint: '주소 전체가 아닌 사이트 이름만 기록합니다.',
		pagesHint: '히트맵 보기에서 섹션별 체류 시간 · 어텐션 맵 · 클릭 맵을 확인할 수 있습니다.',
		subscribersSince: (since: string) =>
			`구독 기록은 ${since}부터 쌓였습니다. 그 전 날짜는 당시 구독 상태로 채운 추정값이라 해지 · 재구독이 반영되어 있지 않습니다.`,
		interestsHint: '한 사람이 관심사를 여러 개 고를 수 있어 합계가 구독자 수보다 클 수 있습니다.',
		tasteNote: (bookmark: number, scrap: number, memo: number, halfLife: number) =>
			`기간과 상관없이 지금 점수입니다. 북마크 ${bookmark} · 스크랩 ${scrap} · 메모 ${memo}점이고, 문장에 그 주제가 나오면 1점을 더하며, ${halfLife}일마다 절반으로 줄어듭니다. 사람별로 계산해 더하므로 한 사람이 신호를 많이 남겨도 그 사람 몫만큼만 반영됩니다.`,
	},
	tags: {
		nameRequired: '새 이름을 입력해 주십시오.',
		renameDesc: '의 이름을 바꿉니다.',
		mergeDesc: '을(를) 한 이름으로 합칩니다.',
		mergeNote:
			'이미 발행한 뉴스레터의 태그도 바뀌고, 앞으로 새 뉴스레터에 같은 태그가 나와도 새 이름으로 바꿔 저장합니다.',
		merged: (to: string, changed: number) => `#${to}(으)로 바꿨습니다. 뉴스레터 ${changed}편의 태그를 수정했습니다.`,
		deleteTitle: (tag: string) => `#${tag} 태그를 삭제하시겠습니까?`,
		deleteBody:
			'이미 발행한 뉴스레터에서 이 태그를 빼고, 앞으로 새 뉴스레터에도 붙이지 않습니다. 규칙을 지우면 앞으로는 다시 붙을 수 있습니다.',
		deleted: (tag: string, changed: number) =>
			`#${tag}을(를) 삭제했습니다. 뉴스레터 ${changed}편의 태그를 수정했습니다.`,
		ruleDeleted: '규칙을 삭제했습니다. 앞으로 발행하는 뉴스레터부터 적용됩니다.',
		pickToMerge: '합칠 태그를 골라 주십시오',
		rulesDesc: '새 뉴스레터를 저장할 때 태그에 적용됩니다. 지워도 이미 바꾼 태그는 그대로입니다.',
		noRules: '아직 규칙이 없습니다. 태그를 합치거나 삭제하면 규칙이 만들어집니다.',
	},
	users: {
		promoteTitle: (email: string) => `${email} 계정을 관리자로 지정하시겠습니까?`,
		demoteTitle: (email: string) => `${email} 계정의 관리자 권한을 해제하시겠습니까?`,
		promoteBody: '관리자는 관리자 화면에서 뉴스레터 · 사용자 · 예약 작업을 모두 바꿀 수 있습니다.',
		demoteBody: '이 사용자는 더 이상 관리자 화면에 들어올 수 없습니다.',
		roleChanged: '권한을 변경했습니다.',
		deleteTitle: (email: string) => `${email} 계정을 삭제하시겠습니까?`,
		deleteBody: '회원 탈퇴와 같습니다. 관심사 · 구독 · 북마크 · 메일 발송 기록이 함께 삭제되며 되돌릴 수 없습니다.',
		deleted: '계정을 삭제했습니다.',
	},
	period: {
		reversed: '시작 날짜가 종료 날짜보다 늦습니다.',
		tooLong: (days: number) => `기간은 ${days}일까지 고를 수 있습니다.`,
	},
};
