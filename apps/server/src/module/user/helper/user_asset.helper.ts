import { ULID_Type } from "@repo/types";
import fs from "fs";
import path from "path";
import { common_upload_folder } from "../../../common/constants/common.constant";


const user_profile_picture_file_path_generator = (user_id: ULID_Type, file_type: string) => {

    const folder_path = path.join(common_upload_folder, 'user_asset', 'profile_picture');

    if (!fs.existsSync(folder_path)) {
        fs.mkdirSync(folder_path, { recursive: true });
    }

    return path.join(folder_path, user_id + "." + file_type);
}

const get_profile_picture_base64 = async (profile_picture_path: string) => {
    if (!fs.existsSync(profile_picture_path)) {
        return null;
    }
    const profile_picture_base64 = fs.readFileSync(profile_picture_path, 'base64');
    return 'data:image/png;base64,' + profile_picture_base64;
}

export const User_Asset_Helper = {
    user_profile_picture_file_path_generator,
    get_profile_picture_base64
};