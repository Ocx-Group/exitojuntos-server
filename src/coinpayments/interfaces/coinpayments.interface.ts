/**
 * Tipos de petición/respuesta de la API v2 de CoinPayments.
 */

export interface CoinPaymentsRestResponse {
  content: string;
  statusCode: number;
  statusText: string;
}

/**
 * Envoltura genérica de respuesta de la API.
 */
export interface CoinPaymentsApiResponse<T> {
  invoices?: T[];
  items?: T[];
}

// ── Currencies (GET /api/v2/currencies) — PÚBLICO, sin auth ─────────

export interface CurrencyLogo {
  imageUrl: string;
}

export interface CurrencyResult {
  id: string;
  type: string;
  symbol: string;
  name: string;
  logo?: CurrencyLogo;
  decimalPlaces: number;
  rank: number;
  status: string;
  capabilities?: string[];
  requiredConfirmations: number;
  isEnabledForPayment: boolean;
}

// ── Creación de factura (request) ───────────────────────────────────

export interface InvoiceItemQuantity {
  value: number;
  /** "2" = unidades. */
  type: string;
}

export interface InvoiceItem {
  name: string;
  quantity: InvoiceItemQuantity;
  originalAmount?: string;
  amount: string;
}

export interface InvoiceAmountBreakdown {
  subtotal: string;
}

export interface InvoiceAmount {
  breakdown?: InvoiceAmountBreakdown;
  total: string;
}

export interface InvoiceWebhook {
  notificationsUrl: string;
  notifications: string[];
}

export interface CreateInvoiceRequest {
  clientId?: string;
  currency: string;
  items: InvoiceItem[];
  amount: InvoiceAmount;
  description?: string;
  invoiceId?: string;
  webhooks?: InvoiceWebhook[];
  customData?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

/** Línea de factura tal como la recibe el provider (antes de transformar). */
export interface InvoiceLineItem {
  name: string;
  quantity: number;
  amount: number;
}

// ── Creación de factura (response) ──────────────────────────────────

export interface InvoiceAmountResponse {
  currencyId: string;
  displayValue: string;
  value: string;
}

export interface CreateInvoiceResult {
  /** id de la factura (mapeado desde "id"). */
  id: string;
  status: string;
  /** mapeado desde "link". */
  link: string;
  /** mapeado desde "checkoutLink". */
  checkoutLink: string;
  qrCodeUrl: string;
  amount?: InvoiceAmountResponse;
  createdAt: string;
  expiresAt: string;
}

// ── Spend request (POST /merchant/wallets/:id/spend/request) ────────

export interface SpendRequestParams {
  toAddress: string;
  toCurrency: string;
  amount: string;
  amountCurrency?: string;
  blockchainFeeOverride?: string;
  blockchainFeeOverrideDecimal?: number;
  memo?: string;
  receiverPaysFee?: boolean;
}

export interface CreateSpendRequest {
  toAddress: string;
  toCurrency: string;
  amount: string;
  amountCurrency?: string;
  blockchainFeeOverride?: string;
  blockchainFeeOverrideDecimal?: number;
  memo?: string;
  receiverPaysFee?: boolean;
}

export interface SpendRequestResult {
  spendRequestId: string;
  fromWalletId: string;
  toAddress: string;
  fromCurrencyId: string;
  fromCurrencySymbol: string;
  fromAmount: string;
  toCurrencyId: string;
  toCurrencySymbol: string;
  toAmount: string;
  blockchainFee: string;
  coinpaymentsFee: string;
  memo?: string;
  conversionPreview?: unknown;
}

// ── Confirmación de spend ───────────────────────────────────────────

export interface ConfirmSpendRequest {
  spendRequestId: string;
}

// ── Merchant wallets ────────────────────────────────────────────────

export interface CreateMerchantWalletRequest {
  currency: string;
  label?: string;
  webhookUrl?: string;
  usePermanentAddresses?: boolean;
}

export interface CreateMerchantWalletResult {
  walletId: string;
  address?: string;
}

export interface MerchantWalletResult {
  walletId: string;
  walletType?: string;
  currencyId: string;
  currencySymbol: string;
  isActive: boolean;
  isLocked: boolean;
  label?: string;
  depositAddress?: string;
  confirmedBalance?: unknown;
  unconfirmedBalance?: unknown;
}
