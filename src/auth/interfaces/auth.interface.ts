export interface JwtPayload {
  sub: string;
  username: string;
  phone: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number | string;
    name: string;
    lastName?: string;
    email?: string;
    username: string;
    phone: string;
    identification?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    imageProfileUrl?: string;
    birtDate?: Date;
    father?: number;
    side?: number;
    status?: boolean;
    termsConditions?: boolean;
    role?: {
      id: number;
      name: string;
    };
    country?: {
      id: number;
      name: string;
    };
  };
}
