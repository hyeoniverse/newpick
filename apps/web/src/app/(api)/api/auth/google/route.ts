import API_ENDPOINTS from '@/constants/api';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
	res.redirect(API_ENDPOINTS.AUTH.CALLBACK());
}
