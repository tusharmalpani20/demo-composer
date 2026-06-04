import { z } from "zod";

export const user_identity_provider_enum_doc = z.enum([
    "orca",
    "workos",
    "google",
    "apple",
    "facebook",
    "github",
    "linkedin",
    "microsoft",
    "twitter",
    "yahoo",
    "yandex",
    "other"
]);
export const EUserIdentityProvider = user_identity_provider_enum_doc;

export type User_Identity_Provider_Enum_Type = z.infer<typeof user_identity_provider_enum_doc>;
export type TUserIdentityProviderEnum = User_Identity_Provider_Enum_Type;
