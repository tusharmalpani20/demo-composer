import { z } from "zod";
import { api_200_response_doc } from "../../common/response_structure.schema";
import { user_asset_doc } from "../schema/user_asset.schema";


export const user_asset_response_doc = user_asset_doc;

export type User_Asset_Response_Type = z.infer<typeof user_asset_response_doc>;
export type TUserAssetResponse = User_Asset_Response_Type;

export const user_asset_profile_picture_upload_response_doc = api_200_response_doc(z.any().nullish());

export type TUserAssetProfilePictureUploadResponse = z.infer<typeof user_asset_profile_picture_upload_response_doc>

export const user_asset_detail_response_doc = api_200_response_doc(z.object({
    user_asset: user_asset_response_doc
}));

export type TUserAssetDetailResponse = z.infer<typeof user_asset_detail_response_doc>