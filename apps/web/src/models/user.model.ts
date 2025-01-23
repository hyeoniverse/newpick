export interface User {
	id: number;
	email: string;
	username: string;
	profileImg?: string;
	accessToken: string | null;
	interests?: string[];
	role: 'user' | 'admin';
	timezone?: string;
	frequency?: 'daily' | 'weekly' | 'monthly';
	notificationPreferences?: {
		email: boolean;
		web: boolean;
	};
	createdAt?: Date;
	updatedAt?: Date;
}
