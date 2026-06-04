// import { Event_Emitter_Events } from "../../../common/constants/event.constant";
// import { event_emitter } from "../../../config/event.config";
// import { send_whatsapp_otp_for_signup } from "./send_otp.event";


export const initialize_authentication_event_emitter = () => {
    try {
        // event_emitter.on(Event_Emitter_Events.Authentication_Events.send_whatsapp_otp_for_signup, send_whatsapp_otp_for_signup);
    } catch (error) {
        console.error("Error initializing file event emitter:", error);
        throw error;
    }
}