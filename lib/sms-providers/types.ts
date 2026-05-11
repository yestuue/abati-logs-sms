export interface SmsProvider {
  name: string;
  buyNumber(country: string, operator: string, service: string): Promise<SmsActivationResponse>;
  checkOrder(orderId: string): Promise<SmsOrderDetails | null>;
  cancelOrder(orderId: string): Promise<boolean>;
  banOrder(orderId: string): Promise<boolean>;
  getPrices(service: string, country: string): Promise<Record<string, SmsOperatorPrice>>;
}

export interface SmsActivationResponse {
  data?: {
    id: string | number;
    phone: string;
    operator: string;
    product: string;
    price: number;
    status: string;
    expires: string;
  };
  error?: string;
}

export interface SmsOrderDetails {
  id: string | number;
  phone: string;
  operator: string;
  product: string;
  price: number;
  status: string;
  expires: string;
  sms: {
    date: string;
    from: string;
    text: string;
    code: string;
  }[] | null;
}

export interface SmsOperatorPrice {
  cost: number;
  count: number;
  rate: number;
}
