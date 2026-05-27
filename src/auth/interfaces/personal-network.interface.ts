export interface PersonalNetworkNode {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  country_name: string;
  status: boolean;
  father: number;
  latitude: number;
  longitude: number;
  created_at: Date;
}

export interface PersonalNetworkResponse {
  network: PersonalNetworkNode[];
  totalNodes: number;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
