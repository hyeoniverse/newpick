import type { ComposedSection } from 'src/edition/compose';
import type { MailPlan } from 'src/edition/mail-plan';
import { Injectable } from '@nestjs/common';
import { MysqlPrismaService } from 'src/prisma/mysql.service';
import { AppException } from 'src/common/errors/app.exception';
import { EditionService } from 'src/edition/edition.service';
import { assertOwnFolder } from './folders.service';
import { monthIndex } from './month-index';

/**
 * 목록용 분야별 소식 제목. 맞춤 메일은 소식 하나씩 점수 순이라 같은 분야를 한 줄로 모은다
 * (분야는 처음 나온 순서, 소식은 메일 순서)
 */
function mergeSections(sections: ComposedSection[]) {
	const merged: {
		category: string;
		newsletterId: number;
		title: string;
		stories: { heading: string; alsoIn: string[] }[];
	}[] = [];
	for (const s of sections) {
		const stories = s.stories.map((st) => ({
			heading: st.story.heading,
			alsoIn: st.alsoIn,
		}));
		const same = merged.find((m) => m.newsletterId === s.newsletterId);
		if (same) same.stories.push(...stories);
		else
			merged.push({
				category: s.category,
				newsletterId: s.newsletterId,
				title: s.title,
				stories,
			});
	}
	return merged;
}

/** 내가 받은 메일 (내 뉴스레터 탭, #123): 목록 · 한 통 다시 만들기 · 중요 / 폴더 표시 */
@Injectable()
export class MyMailsService {
	constructor(
		private readonly prisma: MysqlPrismaService,
		private readonly editionService: EditionService,
	) {}

	/**
	 * 받은 메일 한 통 표시 (#123): 중요 · 폴더 중 준 것만 바꾼다. 내가 받은 메일이어야 하고,
	 * 표시가 처음이면 줄을 만든다 (메일은 보낸 시각으로 가리킨다)
	 */
	async markMail(userId: number, sentAt: Date, changes: { starred?: boolean; folderId?: number | null }) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { email: true },
		});
		if (!user) throw new AppException('USER_NOT_FOUND');
		const received = await this.prisma.emailArchive.findFirst({
			where: { email: user.email, sentAt },
			select: { id: true },
		});
		if (!received) throw new AppException('NOT_FOUND', '받은 메일을 찾을 수 없습니다.');
		if (changes.folderId) await assertOwnFolder(this.prisma, userId, changes.folderId);
		const data = {
			...(changes.starred !== undefined && { starred: changes.starred }),
			...(changes.folderId !== undefined && { folderId: changes.folderId }),
		};
		return this.prisma.mailMark.upsert({
			where: { userId_sentAt: { userId, sentAt } },
			create: { userId, sentAt, ...data },
			update: data,
			select: { sentAt: true, starred: true, folderId: true },
		});
	}

	/**
	 * 내가 실제로 받은 메일 (내 뉴스레터 탭). 발송 기록(email_archives)을 보낸 시각별로 묶어 한 통씩.
	 * 메일 본문은 저장하지 않으므로, 그 메일에 엮어 보낸 뉴스레터들로 보여 준다. 최신 메일부터
	 */
	async getMails(
		userId: number,
		offset = 0,
		limit = 5,
		filters: {
			starred?: boolean;
			folder?: 'none' | number;
			categoryId?: number;
			order?: 'desc' | 'asc';
		} = {},
	) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { email: true },
		});
		if (!user) throw new AppException('USER_NOT_FOUND');

		// 중요 · 폴더 거르기는 표시(mail_marks)에서 보낸 시각을 골라 건다
		const marks = await this.prisma.mailMark.findMany({
			where: { userId },
			select: { sentAt: true, starred: true, folderId: true },
		});
		const markOf = new Map(marks.map((m) => [m.sentAt.getTime(), m]));
		const pick = (keep: (m: (typeof marks)[number]) => boolean) => marks.filter(keep).map((m) => m.sentAt);
		const sentAtFilter =
			filters.starred || typeof filters.folder === 'number'
				? {
						in: pick(
							(m) =>
								(!filters.starred || m.starred) &&
								(typeof filters.folder !== 'number' || m.folderId === filters.folder),
						),
					}
				: filters.folder === 'none'
					? { notIn: pick((m) => m.folderId !== null) }
					: undefined;
		const base = { email: user.email };
		const where = {
			...base,
			...(sentAtFilter && { sentAt: sentAtFilter }),
			...(filters.categoryId && {
				newsletter: { categoryId: filters.categoryId },
			}),
		};
		const [sends, all, everything] = await Promise.all([
			this.prisma.emailArchive.groupBy({
				by: ['sentAt'],
				where,
				orderBy: { sentAt: filters.order ?? 'desc' },
				skip: offset,
				take: limit,
			}),
			this.prisma.emailArchive.groupBy({ by: ['sentAt'], where }),
			// 폴더 줄 · 거르기 칩의 개수 (거르기와 상관없이 전체 기준)
			this.prisma.emailArchive.groupBy({ by: ['sentAt'], where: base }),
		]);
		const counts = {
			all: everything.length,
			starred: marks.filter((m) => m.starred).length,
			unfiled: everything.length - marks.filter((m) => m.folderId !== null).length,
		};
		// 달 이동용: 거르기 · 정렬을 적용한 순서로 달마다 통수와 그 달 첫 메일의 순번 (쪽 계산은 화면에서)
		const months = monthIndex(
			all.map((a) => a.sentAt),
			filters.order ?? 'desc',
		);
		if (!sends.length) return { items: [], total: all.length, counts, months };

		const archives = await this.prisma.emailArchive.findMany({
			where: { ...where, sentAt: { in: sends.map((s) => s.sentAt) } },
			orderBy: { newsletter: { categoryId: 'asc' } },
			select: {
				sentAt: true,
				newsletter: {
					select: {
						id: true,
						title: true,
						subtitle: true,
						imageUrl: true,
						content: true,
						createdAt: true,
						category: { select: { id: true, name: true } },
					},
				},
			},
		});

		// 메일 제목 · 짜임새(오늘을 한눈에 · 흐름 · 분야별 소식 · 관전 포인트)를 발송 때와 같은 방식으로 다시 엮는다 (AI 호출 없음).
		// 메일은 사이트 뉴스레터를 그대로 붙인 게 아니라 고른 분야로 다시 엮은 것이라, 목록도 그 짜임새로 보여 준다
		// 맞춤 메일(#123 3단계)은 그때의 계획으로 (받은 그대로)
		const plans = await this.prisma.mailPlan.findMany({
			where: { email: where.email, sentAt: { in: sends.map((s) => s.sentAt) } },
			select: { sentAt: true, plan: true },
		});
		const planAt = (sentAt: Date) =>
			(plans.find((p) => p.sentAt.getTime() === sentAt.getTime())?.plan ?? null) as MailPlan | null;
		const digests = await Promise.all(
			sends.map(({ sentAt }) =>
				this.editionService.rebuildDigest(
					sentAt,
					archives.filter((a) => a.sentAt.getTime() === sentAt.getTime()).map((a) => a.newsletter.id),
					planAt(sentAt),
				),
			),
		);
		const subjects = digests.map((d) => d?.subject ?? null);

		return {
			total: all.length,
			counts,
			months,
			items: sends.map(({ sentAt }, i) => ({
				sentAt,
				subject: subjects[i],
				digest: digests[i] && {
					top: digests[i].top.map(({ category, heading, line }) => ({
						category,
						heading,
						line,
					})),
					threads: digests[i].threads,
					sections: mergeSections(digests[i].sections),
					watch: digests[i].watch,
				},
				starred: markOf.get(sentAt.getTime())?.starred ?? false,
				folderId: markOf.get(sentAt.getTime())?.folderId ?? null,
				newsletters: archives
					.filter((a) => a.sentAt.getTime() === sentAt.getTime())
					.map(({ newsletter: n }) => ({
						id: n.id,
						title: n.title,
						subtitle: n.subtitle,
						image: n.imageUrl?.split(',').find(Boolean) ?? null,
						summary: n.content ? n.content.substring(0, 100) + '...' : null,
						createdAt: n.createdAt,
						category: n.category,
					})),
			})),
		};
	}

	/**
	 * 받은 메일 한 통을 받은 그대로 (보낸 시각으로 찾는다). 내 발송 기록에 없으면 404
	 */
	async getMail(userId: number, sentAt: Date) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { email: true },
		});
		if (!user) throw new AppException('USER_NOT_FOUND');
		const [archives, saved] = await Promise.all([
			this.prisma.emailArchive.findMany({
				where: { email: user.email, sentAt },
				select: { newsletterId: true },
			}),
			this.prisma.mailPlan.findUnique({
				where: { email_sentAt: { email: user.email, sentAt } },
				select: { plan: true },
			}),
		]);
		const mail =
			archives.length &&
			(await this.editionService.rebuildMail(
				sentAt,
				archives.map((a) => a.newsletterId),
				(saved?.plan ?? null) as MailPlan | null,
			));
		if (!mail) throw new AppException('NOT_FOUND', '받은 메일을 찾을 수 없습니다.');
		return { sentAt, subject: mail.subject, html: mail.html };
	}
}
