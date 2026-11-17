import { errorMessage } from './error-message';

describe('errorMessage', () => {
	it('Error면 message, 아니면 글자로', () => {
		expect(errorMessage(new Error('timeout'))).toBe('timeout');
		expect(errorMessage('429')).toBe('429');
		expect(errorMessage({ code: 1 })).toBe('[object Object]');
		expect(errorMessage(undefined)).toBe('undefined');
	});
});
