export interface User {
	id: number;
	email: string;
	username: string;
	profileImg?: string;
	accessToken: string | null;
	isSubscribed: boolean | undefined;
	interests?: string[];
	role: 'user' | 'admin';
	frequency?: 'daily' | 'weekly' | 'monthly';
	notificationPreferences?: {
		email: boolean;
		web: boolean;
	};
	timezone?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
