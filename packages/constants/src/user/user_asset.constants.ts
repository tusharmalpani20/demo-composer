import { z } from "zod";

export const user_profile_picture_provider_enum = z.enum([
    "orca",
    "google",
    "microsoft",
    "workos"
]);
export const EUserProfilePictureProvider = user_profile_picture_provider_enum;

export type User_Profile_Picture_Provider_Enum_Type = z.infer<typeof user_profile_picture_provider_enum>;
export type TUserProfilePictureProvider = User_Profile_Picture_Provider_Enum_Type;