import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateNewsletterDto } from './newsletter.dto';

const errors = (body: object) => validateSync(plainToInstance(UpdateNewsletterDto, body)).map((e) => e.property);

describe('UpdateNewsletterDto', () => {
	it('공백만 있는 제목 · 요약은 거절한다 (#340: 빈 값으로 저장됐다)', () => {
		expect(errors({ title: '   ', content: ' \n ' })).toEqual(['title', 'content']);
	});

	it('앞뒤 공백은 잘라서 받는다', () => {
		const dto = plainToInstance(UpdateNewsletterDto, { title: '  제목  ' });
		expect(validateSync(dto)).toHaveLength(0);
		expect(dto.title).toBe('제목');
	});
});
