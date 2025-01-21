const bookmarks = [
  { id: 1, newsletterTitle: '북마크한 뉴스레터 1' },
  { id: 2, newsletterTitle: '북마크한 뉴스레터 2' },
  { id: 3, newsletterTitle: '북마크한 뉴스레터 3' },
  { id: 4, newsletterTitle: '북마크한 뉴스레터 4' },
  { id: 5, newsletterTitle: '북마크한 뉴스레터 5' },
  { id: 6, newsletterTitle: '북마크한 뉴스레터 6' },
  { id: 7, newsletterTitle: '북마크한 뉴스레터 7' },
];

const allCategories = [
  { id: 1, categoryName: '정치' },
  { id: 2, categoryName: '경제' },
  { id: 3, categoryName: '사회' },
  { id: 4, categoryName: '문화' },
  { id: 5, categoryName: 'IT' },
  { id: 6, categoryName: '생활' },
  { id: 7, categoryName: '세계' },
  { id: 8, categoryName: '미국' },
];

const subscribedCategories = [
  { id: 1, categoryName: '정치' },
  { id: 2, categoryName: '경제' },
  { id: 4, categoryName: '문화' },
  { id: 6, categoryName: '세계' },
];

const summaries = [
  {
    id: 1,
    categoryName: '정치',
    userId: 1,
    createdAt: '2025-01-01',
    img: `https://picsum.photos/400/300?random=1`,
    likes: true,
    title: 'How to develop the habits you want – and get rid of the ones you don’t (w/ James Clear)How to develop the habits you want – and get rid of the ones you don’t (w/ James Clear)How to develop the habits you want – and get rid of the ones you don’t (w/ James Clear)',
    summary:
      'We all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscripts',
  },
  {
    id: 2,
    categoryName: '경제',
    userId: 1,
    createdAt: '2025-01-01',
    likes: true,
    img: `https://picsum.photos/400/300?random=2`,
    title: 'How to develop the habits you want – and get rid of the ones you don’t (w/ James Clear)',
    summary: 'We all have habits - the good and not-so good kind. But can we use them to our advantage?',
  },
  {
    id: 3,
    categoryName: 'IT',
    likes: false,
    createdAt: '2025-01-01',
    img: `https://picsum.photos/400/300?random=3`,
    title: 'How to develop the habits you want – and get rid of the ones you don’t (w/ James Clear)',
    summary:
      'We all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscripts',
  },
  {
    id: 4,
    categoryName: '생활',
    likes: true,
    createdAt: '2025-01-01',
    img: `https://picsum.photos/400/300?random=4`,
    title: 'How to develop the habits you want – and get rid of the ones you don’t (w/ James Clear)',
    summary:
      'We all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscripts',
  },
  {
    id: 5,
    categoryName: '세계',
    likes: false,
    createdAt: '2025-01-01',
    img: `https://picsum.photos/400/300?random=5`,
    title: 'How to develop the habits you want – and get rid of the ones you don’t (w/ James Clear)',
    summary:
      'We all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscripts',
  },
  {
    id: 6,
    categoryName: '미국',
    likes: true,
    createdAt: '2025-01-01',
    img: `https://picsum.photos/400/300?random=6`,
    title: 'How to develop the habits you want – and get rid of the ones you don’t (w/ James Clear)',
    summary:
      'We all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscriptsWe all have habits - the good and not-so good kind. But can we use them to our advantage? In this week’s episode, Chris is joined by James Clear, entrepreneur and author of #1 New York Times bestseller, “Atomic Habits”, for a conversation about the power of habitual behavior. They discuss the science of habit formation, how to understand the forces that motivate you, and why the sum of many little habits can add up to a better life. For the full text transcript, visit go.ted.com/BHTranscripts',
  },
];

const feedback = [
  {
    id: 1,
    userId: 1,
    newsletterId: 3,
    likes: 98,
    comments: `Flutter를 좋아하는 개발자 이다보니,  flitter, easyrd를 알게되어 디코도 들어가서 눈독만들이고 쓰지는 못했었는데요 headless-chart도 만드셨군요.  저도 웹에서 차트라이브러리를 요구사항이 추가될때마다 라이브러리를 바꿔야하는 슬픈 경험이 있어서 공감 됩니다. 차트의 경우 다음번에 flitter 내지는 headless-chart를 써보려고 염두하고 있습니다.  좋은 오픈소스와 글 감사드리며, flitter 만드실때 AI를 활용하셨던거 같은데 제가 너무 궁금해서 해당 경험도 공유 해주실 기회도 있기를 기도합니다 ㅎㅎ`,
    createdAt: '2024-10-09',
  },
	{
		id: 2,
		userId: 2,
		newsletterId: 3,
		likes: 10,
		comments: `안녕하세요. 궁금한 점이 있어 몇가지 질문드립니다.  1. D3.js는 개발의 어려움을 제외하면 자유도가 매우 높다고 생각되는데 headless-chart와 비교하면 어떤가요? 자유도와 사용의 용이함이 trade-off가 있나요 아니면 자유도와 사용의 용이함 전부 개발하신 라이브러리가 우세한가요? 2. 선언형 차트 라이브러리로 vega, vega-lite가 있는데 개발하신 라이브러리는 위 두개의 라이브러리대비 어떠한 차별성이 있을까요? 3.개발하신 라이브러리가 근본적으로 추후에 기능이 추가된다면 상상할 수 있는 모든 2D차트와 상호작용을 구현할 수 있는 설계인가요? 웹 개발 지식이 충분하지않아 다소 분석이 부족한 상태로 질문드립니다. 양해 부탁드립니다, 감사합니다!`,
		createdAt: '2024-10-03',
	},
	{
		id: 3,
		userId: 1,
		newsletterId: 3,
		likes: 6,
		comments: `ㅋㅋㅋㅋㅋㅋㅋㅋ개웃기네요`,
		createdAt: '2024-10-23',
	},
]

export const currentUserData = { bookmarks, allCategories, subscribedCategories, summaries, feedback };
