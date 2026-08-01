export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  principal_id: string;
  principal_type: "customer" | "staff";
  email: string;
  role: string;
  access_token: string;
  token_type: string;
}

