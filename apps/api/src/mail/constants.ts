import { env } from '../config/env';

/** Gmail SMTP. 계정은 읽을 때 env에서 (예전에는 이 파일이 .env를 따로 한 번 더 읽었다) */
export const NODEMAILER_CONFIG = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    get user() {
      return env.mailUser;
    },
    get pass() {
      return env.mailPassword;
    },
  },
};

export const NODEMAILER = 'NODEMAILER';
