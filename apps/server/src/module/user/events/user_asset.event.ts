import { User_Asset_Type } from "@repo/types";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const user_profile_picture_upload_event_handler = async (
    user_asset: User_Asset_Type,
    temp_file_path: string
) => {
    try {
        if (user_asset.profile_picture_path) {
            console.info("File storage provider: local");

            //here we will copy the file from temp folder to the appropriate folder
            //we have commented the below since we are getting temp_file_path from the root folder i.e ./temp-folder/*.file_type 
            //if we add common_temp_folder, then it will be ./temp-folder/temp-folder/*.file_type
            // const temporary_file_path = path.join(common_temp_folder, temp_file_path);

            const temporary_file_path = path.join(temp_file_path);

            // Update the file extension to .png
            const destination_file_path = path.join(
                "./",
                user_asset.profile_picture_path.replace(/\.[^/.]+$/, ".png")
            );
            const destination_dir = path.dirname(destination_file_path);
            fs.mkdirSync(destination_dir, { recursive: true });

            // Process and save the image using Sharp
            await sharp(temporary_file_path)
                .png({ quality: 90 })
                .toFile(destination_file_path);

            console.info("File saved to:", destination_file_path);

            //now we will delete the file from the temp folder
            console.info("Deleting file from temp folder:", temporary_file_path);

            fs.unlinkSync(temporary_file_path);

            console.info("File deleted from temp folder:", temporary_file_path);
        }
    } catch (error) {
        console.error("Error uploading user profile picture:", error);
        throw error;
    }
}
