export type AuthContext = {
  user: {
    id: string;
    email: string;
    display_name: string;
  };
  organization: {
    id: string;
    name: string;
  };
  org_user: {
    id: string;
    role: string;
  };
  session: {
    id: string;
    session_type: string;
    expires_at: string;
  };
};

export type AuthResponse = {
  auth: AuthContext;
};
