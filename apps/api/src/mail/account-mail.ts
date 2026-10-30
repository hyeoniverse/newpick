import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';

/** 계정 안내 메일(인증 코드 · 이메일이 바뀜)의 공통 틀 */
export const accountMailHtml = (title: string, body: string) =>
  `<div style="font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
  <p style="margin:0 0 24px;font-size:20px;font-weight:800;color:#3610e1">NewPick</p>
  <p style="margin:0 0 16px;font-size:18px;font-weight:700">${title}</p>
  ${body}
  <p style="margin:32px 0 0;font-size:12px;color:#737373">이 메일은 발신 전용입니다.</p>
</div>`;

/**
 * 예전 주소에 '이메일이 바뀌었어요' 알림 (본인이 아니면 알아챌 수 있게).
 * 인증 코드로 받는 주소를 바꿨을 때 · 다른 Google 계정으로 바꿨을 때 같이 쓴다. 못 보내도 바꾸기는 그대로
 */
export async function notifyEmailChanged(
  mail: MailService,
  oldEmail: string,
  newEmail: string,
  how: string,
) {
  try {
    await mail.sendHtmlMail(
      oldEmail,
      '',
      accountMailHtml(
        '이메일이 바뀌었어요',
        `<p style="margin:0;font-size:15px;line-height:1.6">뉴픽 계정의 이메일이 <b>${newEmail}</b>(으)로 바뀌었습니다 (${how}). 앞으로 뉴스레터는 새 주소로 갑니다.</p>
  <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6b6b6b">직접 바꾸지 않았다면 hyeoniverse.dev@gmail.com으로 알려 주세요.</p>`,
      ),
      '[뉴픽] 이메일이 바뀌었어요',
    );
  } catch (error) {
    new Logger('AccountMail').warn(
      `예전 주소 알림 실패: ${(error as Error).message}`,
    );
  }
}
