import { Injectable, Logger } from '@nestjs/common';
import { BrevoService } from './brevo.service';
import {
  SendEmailOptions,
  SendTemplateEmailOptions,
  EmailRecipient,
} from './interfaces';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly brevoService: BrevoService) {}

  async queueEmail(options: SendEmailOptions): Promise<void> {
    try {
      const result = await this.brevoService.sendEmail(options);
      if (!result.success) {
        throw new Error(result.error || 'Error al enviar email');
      }
      this.logger.log(
        `Email enviado (MessageId: ${result.messageId}) a ${options.to.map((r) => r.email).join(', ')}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al enviar email: ${errorMessage}`);
      throw error;
    }
  }

  async queueTemplateEmail(options: SendTemplateEmailOptions): Promise<void> {
    try {
      const result = await this.brevoService.sendTemplateEmail(options);
      if (!result.success) {
        throw new Error(result.error || 'Error al enviar email de template');
      }
      this.logger.log(
        `Email de template ${options.templateId} enviado (MessageId: ${result.messageId}) a ${options.to.map((r) => r.email).join(', ')}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al enviar email de template: ${errorMessage}`);
      throw error;
    }
  }

  async queueSimpleEmail(
    to: string | EmailRecipient,
    subject: string,
    htmlContent: string,
    textContent?: string,
  ): Promise<void> {
    const recipient: EmailRecipient =
      typeof to === 'string' ? { email: to } : to;

    return this.queueEmail({
      to: [recipient],
      subject,
      htmlContent,
      textContent,
    });
  }
}
