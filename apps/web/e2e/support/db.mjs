import mysql from 'mysql2/promise';
import { E2E } from './env.mjs';

/** E2E가 만든 행 표시. 지울 때 이 값으로만 지운다 */
const MARK = 'https://example.com/e2e-';

export const SEEDED_NEWSLETTERS = [1, 2, 3, 4, 5, 6].map((categoryId) => ({
	categoryId,
	title: `[E2E] 카테고리 ${categoryId} 뉴스레터`,
	usedNews: `${MARK}${categoryId}`,
}));

/**
 * @template T
 * @param {(db: import('mysql2/promise').Connection) => Promise<T>} run
 * @returns {Promise<T>}
 */
async function withDb(run) {
	const db = await mysql.createConnection(E2E.mysqlUrl);
	try {
		return await run(db);
	} finally {
		await db.end();
	}
}

/**
 * 카테고리마다 뉴스레터 하나. 이미 있으면 그대로 둔다.
 * 홈·소개는 빌드할 때 데이터를 읽어 정적으로 만들어지므로, next build보다 먼저 실행해야 한다 (e2e/seed.mjs).
 */
export const seedNewsletters = () =>
	withDb(async (db) => {
		for (const n of SEEDED_NEWSLETTERS) {
			await db.query(
				`INSERT INTO newsletters (title, content, contentAsHTML, imageUrl, categoryId, viewcount, usedNews, createdAt)
				 SELECT ?, '[E2E] 요약 본문', '<div><p>[E2E] 요약 본문</p></div>', '', ?, 0, ?, NOW()
				 WHERE NOT EXISTS (SELECT 1 FROM newsletters WHERE usedNews = ?)`,
				[n.title, n.categoryId, n.usedNews, n.usedNews],
			);
		}
	});

/** 테스트 사용자를 지우고 다시 만든다. 구독·관심사·북마크는 FK cascade로 함께 지워진다 */
export const resetUser = () =>
	withDb(async (db) => {
		await db.query('DELETE FROM users WHERE email = ?', [E2E.userEmail]);
		const [result] = await db.query('INSERT INTO users (email, username, updatedAt) VALUES (?, ?, NOW())', [
			E2E.userEmail,
			'E2E 사용자',
		]);
		return /** @type {import('mysql2/promise').ResultSetHeader} */ (result).insertId;
	});

/** @param {string} title */
export const newsletterIdByTitle = (title) =>
	withDb(async (db) => {
		const [rows] = /** @type {[import('mysql2/promise').RowDataPacket[], unknown]} */ (
			await db.query('SELECT id FROM newsletters WHERE title = ? LIMIT 1', [title])
		);
		if (!rows.length) throw new Error(`시드한 뉴스레터가 없습니다: ${title}`);
		return /** @type {number} */ (rows[0].id);
	});

/** @param {number} id */
export const viewCount = (id) =>
	withDb(async (db) => {
		const [rows] = /** @type {[import('mysql2/promise').RowDataPacket[], unknown]} */ (
			await db.query('SELECT viewcount FROM newsletters WHERE id = ?', [id])
		);
		return /** @type {number} */ (rows[0].viewcount);
	});
