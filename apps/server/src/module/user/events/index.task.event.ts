import { Event_Emitter_Events } from "../../../common/constants/event.constant";
import { event_emitter } from "../../../config/event.config";
import { user_profile_picture_upload_event_handler } from "./user_asset.event";

export const initialize_user_event_emitter = () => {
    try {
        //User Asset Events
        event_emitter.on(
            Event_Emitter_Events.User_Asset_Events.user_profile_picture_upload,
            user_profile_picture_upload_event_handler
        );
    } catch (error) {
        console.error("Error initializing file event emitter:", error);
        throw error;
    }
}