import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { StartSubscriptionDto } from './start-subscription.dto';

const errors = (body: object) => validateSync(plainToInstance(StartSubscriptionDto, body));

describe('StartSubscriptionDto', () => {
	it('관심사를 빼면 받는다 (지금 관심사를 그대로 둠)', () => {
		expect(errors({})).toHaveLength(0);
	});

	it('관심사가 한 개 이상이면 받는다', () => {
		expect(errors({ interests: [1, 2] })).toHaveLength(0);
	});

	it('빈 배열은 거절한다: 관심사가 0개가 되면 구독 중이어도 메일이 가지 않는다', () => {
		expect(errors({ interests: [] })).toHaveLength(1);
	});
});
