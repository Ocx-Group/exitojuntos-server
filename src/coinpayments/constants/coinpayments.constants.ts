/**
 * Claves de configuración (variables de entorno) usadas por el módulo CoinPayments.
 * Equivalente a CoinPaymentsConfigKeys en la implementación C#.
 */
export const COINPAYMENTS_CONFIG_KEYS = {
  ClientSecret: 'COINPAYMENTS_CLIENT_SECRET',
  ClientId: 'COINPAYMENTS_CLIENT_ID',
  BaseUrl: 'COINPAYMENTS_BASE_URL',
  InvoiceCurrency: 'COINPAYMENTS_INVOICE_CURRENCY',
  WebhookNotificationsUrl: 'COINPAYMENTS_WEBHOOK_NOTIFICATIONS_URL',
  SuccessUrl: 'COINPAYMENTS_SUCCESS_URL',
  CancelUrl: 'COINPAYMENTS_CANCEL_URL',
} as const;

/**
 * Tipos de eventos de webhook de CoinPayments.
 * La comparación debe ser case-insensitive según recomienda CoinPayments.
 */
export const COINPAYMENTS_WEBHOOK_EVENTS = {
  InvoiceCreated: 'invoiceCreated',
  InvoicePending: 'invoicePending',
  InvoicePaid: 'invoicePaid',
  InvoiceCompleted: 'invoiceCompleted',
  InvoiceCancelled: 'invoiceCancelled',
  InvoiceTimedOut: 'invoiceTimedOut',
  InvoicePaymentCreated: 'invoicePaymentCreated',
  InvoicePaymentTimedOut: 'invoicePaymentTimedOut',
} as const;

export type CoinPaymentsWebhookEvent =
  (typeof COINPAYMENTS_WEBHOOK_EVENTS)[keyof typeof COINPAYMENTS_WEBHOOK_EVENTS];

/** Conjunto de todos los eventos en minúsculas para comparación case-insensitive. */
export const COINPAYMENTS_ALL_WEBHOOK_EVENTS: ReadonlySet<string> = new Set(
  Object.values(COINPAYMENTS_WEBHOOK_EVENTS).map((event) =>
    event.toLowerCase(),
  ),
);

/** Eventos suscritos por defecto al crear una factura. */
export const COINPAYMENTS_INVOICE_NOTIFICATIONS: readonly string[] = [
  COINPAYMENTS_WEBHOOK_EVENTS.InvoicePending,
  COINPAYMENTS_WEBHOOK_EVENTS.InvoicePaid,
  COINPAYMENTS_WEBHOOK_EVENTS.InvoiceCompleted,
  COINPAYMENTS_WEBHOOK_EVENTS.InvoiceCancelled,
  COINPAYMENTS_WEBHOOK_EVENTS.InvoiceTimedOut,
];

/** Valores por defecto del proveedor. Equivalente a CoinPaymentsDefaults. */
export const COINPAYMENTS_DEFAULTS = {
  BaseUrl: 'https://a-api.coinpayments.net/api/',
  HttpClientTimeoutSeconds: 30,
  DefaultInvoiceCurrency: '5057',
  SuccessUrl: 'https://exitojuntos.com/mis-pedidos',
  CancelUrl: 'https://exitojuntos.com/',
} as const;

/**
 * Endpoints relativos de la API v2 de CoinPayments.
 * Equivalente a CoinPaymentsEndpoints (los string.Format se convierten en funciones).
 */
export const COINPAYMENTS_ENDPOINTS = {
  CreateInvoice: 'v2/merchant/invoices',
  GetInvoiceById: (invoiceId: string) => `v2/merchant/invoices/${invoiceId}`,
  GetCurrencies: 'v2/currencies',
  RegisterWebhook: (clientId: string) =>
    `v2/merchant/clients/${clientId}/webhooks`,
  CreateSpendRequest: (walletId: string) =>
    `v2/merchant/wallets/${walletId}/spend/request`,
  ConfirmSpendRequest: (walletId: string) =>
    `v2/merchant/wallets/${walletId}/spend/confirmation`,
  GetMerchantWallets: 'v2/merchant/wallets',
} as const;

/** Parámetros de resiliencia (reintentos / circuit breaker). */
export const COINPAYMENTS_RESILIENCE = {
  RetryCount: 3,
  CircuitBreakerFailureThreshold: 5,
  CircuitBreakerDurationSeconds: 30,
} as const;
