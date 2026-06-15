export type FirstRunSetupInput = {
  owner: {
    email: string;
    password: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  organization: {
    name: string;
  };
};
