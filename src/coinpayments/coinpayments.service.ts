import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  COINPAYMENTS_CONFIG_KEYS,
  COINPAYMENTS_DEFAULTS,
  COINPAYMENTS_ENDPOINTS,
  COINPAYMENTS_INVOICE_NOTIFICATIONS,
} from './constants/coinpayments.constants';
import {
  CoinPaymentsRestResponse,
  ConfirmSpendRequest,
  CreateInvoiceRequest,
  CreateMerchantWalletRequest,
  CreateSpendRequest,
  InvoiceItem,
  InvoiceLineItem,
  SpendRequestParams,
} from './interfaces/coinpayments.interface';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Proveedor de CoinPayments API v2.
 * Conversión a NestJS de CryptoJackpot.Order.Application.Providers.CoinPaymentProvider.
 *
 * Usa `fetch` (global en Node 18+) en lugar de IHttpClientFactory y `node:crypto`
 * para la firma HMAC-SHA256, manteniendo la misma lógica de autenticación.
 */
@Injectable()
export class CoinpaymentsService {
  private readonly logger = new Logger(CoinpaymentsService.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly invoiceCurrency: string;
  private readonly webhookNotificationsUrl?: string;
  private readonly webhookSecret?: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly timeoutMs =
    COINPAYMENTS_DEFAULTS.HttpClientTimeoutSeconds * 1000;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>(
      COINPAYMENTS_CONFIG_KEYS.ClientId,
      '',
    );
    this.clientSecret = this.configService.get<string>(
      COINPAYMENTS_CONFIG_KEYS.ClientSecret,
      '',
    );

    // BaseUrl debe terminar en "/" para que los endpoints relativos se resuelvan correctamente.
    const baseUrl = this.configService.get<string>(
      COINPAYMENTS_CONFIG_KEYS.BaseUrl,
      COINPAYMENTS_DEFAULTS.BaseUrl,
    );
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    this.invoiceCurrency = this.configService.get<string>(
      COINPAYMENTS_CONFIG_KEYS.InvoiceCurrency,
      COINPAYMENTS_DEFAULTS.DefaultInvoiceCurrency,
    );
    this.webhookNotificationsUrl = this.configService.get<string>(
      COINPAYMENTS_CONFIG_KEYS.WebhookNotificationsUrl,
    );
    this.webhookSecret = this.configService.get<string>(
      COINPAYMENTS_CONFIG_KEYS.WebhookSecret,
    );
    this.successUrl = this.configService.get<string>(
      COINPAYMENTS_CONFIG_KEYS.SuccessUrl,
      COINPAYMENTS_DEFAULTS.SuccessUrl,
    );
    this.cancelUrl = this.configService.get<string>(
      COINPAYMENTS_CONFIG_KEYS.CancelUrl,
      COINPAYMENTS_DEFAULTS.CancelUrl,
    );

    if (this.clientId && this.clientSecret) {
      this.logger.log('CoinPayments configurado correctamente.');
    } else {
      this.logger.error(
        'COINPAYMENTS_CLIENT_ID / COINPAYMENTS_CLIENT_SECRET no configurados. El proveedor no funcionará.',
      );
    }
  }

  /** ¿Están configuradas las credenciales del proveedor? */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Parsea el cuerpo JSON de una respuesta cruda. Si CoinPayments devolvió un
   * código de error (>= 400) lo propaga como HttpException con el mismo status.
   */
  parse(response: CoinPaymentsRestResponse): unknown {
    const parsed = response.content
      ? this.safeJsonParse(response.content)
      : null;

    if (response.statusCode >= 400) {
      throw new HttpException(
        (parsed ?? { message: response.statusText }) as
          | string
          | Record<string, unknown>,
        response.statusCode,
      );
    }

    return parsed;
  }

  private safeJsonParse(content: string): unknown {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  /**
   * Crea una factura (invoice) de pago.
   * Equivalente a CreateInvoiceAsync.
   */
  createInvoice(
    amount: number,
    items: InvoiceLineItem[],
    options: {
      currency?: string;
      description?: string;
      notificationsUrl?: string;
    } = {},
  ): Promise<CoinPaymentsRestResponse> {
    const totalAmount = this.toMoney(amount);

    const invoiceItems: InvoiceItem[] = items.map((item) => ({
      name: item.name,
      quantity: {
        value: item.quantity,
        type: '2',
      },
      originalAmount: this.toMoney(item.amount),
      amount: this.toMoney(item.amount * item.quantity),
    }));

    const notificationsUrl =
      options.notificationsUrl ?? this.webhookNotificationsUrl;

    const body: CreateInvoiceRequest = {
      clientId: this.clientId,
      currency: options.currency ?? this.invoiceCurrency,
      items: invoiceItems,
      amount: {
        breakdown: { subtotal: totalAmount },
        total: totalAmount,
      },
      description: options.description,
      successUrl: this.successUrl,
      cancelUrl: this.cancelUrl,
      webhooks: notificationsUrl
        ? [
            {
              notificationsUrl,
              notifications: [...COINPAYMENTS_INVOICE_NOTIFICATIONS],
            },
          ]
        : undefined,
    };

    return this.send('POST', COINPAYMENTS_ENDPOINTS.CreateInvoice, body);
  }

  /** Obtiene una factura por id. Equivalente a GetInvoiceAsync. */
  getInvoice(invoiceId: string): Promise<CoinPaymentsRestResponse> {
    return this.send('GET', COINPAYMENTS_ENDPOINTS.GetInvoiceById(invoiceId));
  }

  /** Lista las monedas soportadas (endpoint público sin auth). Equivalente a GetCurrenciesAsync. */
  getCurrencies(): Promise<CoinPaymentsRestResponse> {
    return this.sendPublic(COINPAYMENTS_ENDPOINTS.GetCurrencies);
  }

  /** Registra un webhook a nivel de cliente. Equivalente a RegisterWebhookAsync. */
  registerWebhook(
    notificationsUrl: string,
    notifications: string[],
  ): Promise<CoinPaymentsRestResponse> {
    const body = { notificationsUrl, notifications };
    return this.send(
      'POST',
      COINPAYMENTS_ENDPOINTS.RegisterWebhook(this.clientId),
      body,
    );
  }

  /** Lista los wallets del merchant. Equivalente a GetMerchantWalletsAsync. */
  getMerchantWallets(): Promise<CoinPaymentsRestResponse> {
    return this.send('GET', COINPAYMENTS_ENDPOINTS.GetMerchantWallets);
  }

  /** Crea un wallet de merchant. Equivalente a CreateMerchantWalletAsync. */
  createMerchantWallet(
    currencyId: string,
    label?: string,
  ): Promise<CoinPaymentsRestResponse> {
    const body: CreateMerchantWalletRequest = {
      currency: currencyId,
      label,
    };
    return this.send('POST', COINPAYMENTS_ENDPOINTS.GetMerchantWallets, body);
  }

  /** Crea una solicitud de retiro/conversión. Equivalente a CreateSpendRequestAsync. */
  createSpendRequest(
    walletId: string,
    params: SpendRequestParams,
  ): Promise<CoinPaymentsRestResponse> {
    const body: CreateSpendRequest = {
      toAddress: params.toAddress,
      toCurrency: params.toCurrency,
      amount: params.amount,
      amountCurrency: params.amountCurrency,
      blockchainFeeOverride: params.blockchainFeeOverride,
      blockchainFeeOverrideDecimal: params.blockchainFeeOverrideDecimal,
      memo: params.memo,
      receiverPaysFee: params.receiverPaysFee,
    };
    return this.send(
      'POST',
      COINPAYMENTS_ENDPOINTS.CreateSpendRequest(walletId),
      body,
    );
  }

  /** Confirma una solicitud de retiro pendiente. Equivalente a ConfirmSpendRequestAsync. */
  confirmSpendRequest(
    walletId: string,
    spendRequestId: string,
  ): Promise<CoinPaymentsRestResponse> {
    const body: ConfirmSpendRequest = { spendRequestId };
    return this.send(
      'POST',
      COINPAYMENTS_ENDPOINTS.ConfirmSpendRequest(walletId),
      body,
    );
  }

  /**
   * Verifica la firma de un webhook entrante de CoinPayments.
   * CoinPayments firma el cuerpo crudo con HMAC-SHA256 usando el webhook secret
   * y lo envía en la cabecera `X-CoinPayments-Signature` (base64).
   */
  verifyWebhookSignature(rawBody: string, signature?: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn(
        'COINPAYMENTS_WEBHOOK_SECRET no configurado; no se puede verificar la firma del webhook.',
      );
      return false;
    }
    if (!signature) return false;

    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== signatureBuffer.length) return false;

    return timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  // ── Internos ──────────────────────────────────────────────────────

  /** Formatea un monto a string con 2 decimales (equivalente a ToString("F2", InvariantCulture)). */
  private toMoney(value: number): string {
    return value.toFixed(2);
  }

  /**
   * Construye la firma HMAC-SHA256 de la petición.
   * Mensaje: BOM + método + urlCompleta + clientId + timestamp + body.
   * Equivalente a BuildSignature.
   */
  private buildSignature(
    httpMethod: string,
    fullUrl: string,
    timestamp: string,
    body: string,
  ): string {
    // El BOM (U+FEFF) inicial es obligatorio según la especificación de firma de CoinPayments.
    const bom = String.fromCodePoint(0xfeff);
    const message = `${bom}${httpMethod}${fullUrl}${this.clientId}${timestamp}${body}`;
    return createHmac('sha256', this.clientSecret)
      .update(message, 'utf8')
      .digest('base64');
  }

  /** Petición autenticada. Equivalente a SendAsync. */
  private async send(
    method: HttpMethod,
    relativeEndpoint: string,
    body?: unknown,
  ): Promise<CoinPaymentsRestResponse> {
    const requestUri = new URL(relativeEndpoint, this.baseUrl).toString();
    const timestamp = new Date().toISOString().slice(0, 19);
    const bodyJson = body === undefined ? '' : JSON.stringify(body);
    const signature = this.buildSignature(
      method,
      requestUri,
      timestamp,
      bodyJson,
    );

    const headers: Record<string, string> = {
      'X-CoinPayments-Client': this.clientId,
      'X-CoinPayments-Timestamp': timestamp,
      'X-CoinPayments-Signature': signature,
    };
    if (bodyJson) headers['Content-Type'] = 'application/json';

    return this.execute(method, requestUri, headers, bodyJson || undefined);
  }

  /** Petición pública (sin firma). Equivalente a SendPublicAsync. */
  private sendPublic(
    relativeEndpoint: string,
  ): Promise<CoinPaymentsRestResponse> {
    const requestUri = new URL(relativeEndpoint, this.baseUrl).toString();
    return this.execute('GET', requestUri, {});
  }

  private async execute(
    method: HttpMethod,
    url: string,
    headers: Record<string, string>,
    body?: string,
  ): Promise<CoinPaymentsRestResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const content = await response.text();
      return {
        content,
        statusCode: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error contactando la API de CoinPayments: ${message}`);
      throw new ServiceUnavailableException(
        `Error contactando la API de CoinPayments: ${message}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
