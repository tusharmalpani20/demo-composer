import { ORGANIZATION_ROLES } from "@repo/constants";
import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeStringSchema,
} from "./common";

export const AuthUserSchema = z.object({
  id: IdSchema,
  email: z.string(),
  display_name: z.string(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthOrganizationSchema = z.object({
  id: IdSchema,
  name: z.string(),
});
export type AuthOrganization = z.infer<typeof AuthOrganizationSchema>;

export const AuthOrgUserSchema = z.object({
  id: IdSchema,
  role: z.enum(ORGANIZATION_ROLES),
});
export type AuthOrgUser = z.infer<typeof AuthOrgUserSchema>;

export const AuthSessionSchema = z.object({
  id: IdSchema,
  session_type: z.string(),
  expires_at: IsoDateTimeStringSchema,
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const AuthContextSchema = z.object({
  user: AuthUserSchema,
  organization: AuthOrganizationSchema,
  org_user: AuthOrgUserSchema,
  session: AuthSessionSchema,
});
export type AuthContext = z.infer<typeof AuthContextSchema>;

export const AuthResponseSchema = z.object({
  auth: AuthContextSchema,
}).strict();
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = AuthResponseSchema;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const ExtensionLoginResponseSchema = z.object({
  auth: AuthContextSchema,
  session_token: z.string().min(1),
}).strict();
export type ExtensionLoginResponse = z.infer<typeof ExtensionLoginResponseSchema>;
