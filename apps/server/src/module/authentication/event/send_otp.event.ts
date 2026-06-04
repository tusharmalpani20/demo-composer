// import { WhatsAppClient } from "../../../config/whatsapp.config";

// export const send_whatsapp_otp_for_signup = async (
//     send_to: string,
//     otp_code: string
// ) => {

//     try {
//         const whatsapp_instance = WhatsAppClient.getInstance();

//         await whatsapp_instance.sendTemplate(
//             send_to,
//             "gp_auth_otp",
//             "en_US",
//             [
//                 {
//                     "type": "body",
//                     "parameters": [
//                         {
//                             "type": "text",
//                             "text": otp_code
//                         }
//                     ]
//                 },
//                 // {
//                 //     "type": "body",
//                 //     "add_security_recommendation": true
//                 // },
//                 // {
//                 //     "type": "footer",
//                 //     "code_expiration_minutes": expires_in_minutes
//                 // },
//                 {
//                     "type": "button",
//                     "sub_type": "url",
//                     "index": "0",
//                     "parameters": [
//                         {
//                             "type": "text",
//                             "text": otp_code
//                         }
//                     ]
//                 }
//             ]
//         );
//     } catch (error) {
//         console.error("Error saving file:", error);
//         throw error;
//     }
// }