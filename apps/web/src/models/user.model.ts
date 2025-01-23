export interface User {
	id: number;
	role: 'user' | 'admin';
	email: string;
	username: string;
	profileImg?: string;
	interests?: string[];
	// timezone?: string;
	// frequency?: 'daily' | 'weekly' | 'monthly';
	// notificationPreferences?: {
	// 	email: boolean;
	// 	web: boolean;
	// };
	// createdAt?: Date;
	// updatedAt?: Date;
}
