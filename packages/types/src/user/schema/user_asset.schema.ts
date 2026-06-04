import {
    user_profile_picture_provider_enum
} from "@repo/constants";
import { z } from "zod";
import {
    boolean_preprocess_doc,
    date_doc,
    multipart_file_doc,
    ulid_doc,
    version_doc
} from "../../common/common.schema";
import { organization_doc } from "../../organization/schema/organization.schema";

export const user_asset_doc = z.object({
    user_id: ulid_doc,
    organization_id: organization_doc.shape.id,
    profile_picture_provider: user_profile_picture_provider_enum.nullish(),
    profile_picture_path: z.string().nullish(),
    profile_picture_url: z.string().nullish(),
    is_deleted: boolean_preprocess_doc,
    deleted_at: date_doc.nullish(),
    deleted_by_id: ulid_doc.nullish(),
    version: version_doc,
    created_by_id: ulid_doc.nullish(),
    updated_by_id: ulid_doc.nullish(),
    created_at: date_doc,
    updated_at: date_doc,
});

export type User_Asset_Type = z.infer<typeof user_asset_doc>;
export type TUserAsset = User_Asset_Type;

export const user_asset_create_doc = user_asset_doc.pick({
    user_id: true,
    organization_id: true,
    profile_picture_provider: true,
    profile_picture_path: true,
    profile_picture_url: true,
    created_at: true,
    updated_at: true,
});

export type User_Asset_Create_Type = z.infer<typeof user_asset_create_doc>;
export type TUserAssetCreate = User_Asset_Create_Type;

export type User_Asset_Signup_Create_Type = Omit<User_Asset_Create_Type, "organization_id">;
export type TUserAssetSignupCreate = User_Asset_Signup_Create_Type;

export const user_asset_update_doc = user_asset_doc.pick({
    user_id: true,
    profile_picture_provider: true,
    profile_picture_path: true,
    profile_picture_url: true,
    updated_at: true,
});

export type User_Asset_Update_Type = z.infer<typeof user_asset_update_doc>;
export type TUserAssetUpdate = User_Asset_Update_Type;

export const user_asset_profile_picture_upload_doc = z.object({
    upload_file: multipart_file_doc,
});

export type User_Asset_Profile_Picture_Upload_Type = z.infer<typeof user_asset_profile_picture_upload_doc>;
export type TUserAssetProfilePictureUpload = User_Asset_Profile_Picture_Upload_Type;

export const user_asset_profile_picture_upload_client_doc = z.object({
    upload_file: z.any(),
});

export type User_Asset_Profile_Picture_Upload_Client_Type = z.infer<typeof user_asset_profile_picture_upload_client_doc>;
export type TUserAssetProfilePictureUploadClient = User_Asset_Profile_Picture_Upload_Client_Type;
