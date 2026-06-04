
import {
    z
} from "zod";
import { version_doc } from "../../common/common.schema";
import {
    user_common_doc,
    user_doc
} from "./user.schema";

export const user_me_update_doc = user_doc.pick({
    id: true,
    first_name: true,
    last_name: true,
    full_name: true,
    updated_at: true,
    updated_by_id: true,
}).partial({
    first_name: true,
    last_name: true,
    full_name: true,
});

export type User_Me_Update_Type = z.infer<typeof user_me_update_doc>;
export type TUserMeUpdate = User_Me_Update_Type;

export const user_me_update_validation_doc = user_me_update_doc.pick({
    first_name: true,
    last_name: true,
}).partial({
    first_name: true,
    last_name: true,
}).extend({
    version: version_doc,
}).strict();

export type User_Me_Update_Validation_Type = z.infer<typeof user_me_update_validation_doc>;
export type TUserMeUpdateValidation = User_Me_Update_Validation_Type;

export const user_me_set_password_validation_doc = z.object({
    password: user_common_doc.user_password_before_hash_doc,
    confirm_password: user_common_doc.user_password_before_hash_doc,
}).strict().superRefine((data, ctx) => {
    if (data.password !== data.confirm_password) {
        ctx.addIssue({
            code: "custom",
            message: "Passwords do not match",
            path: ["confirm_password"],
        });
    }
});

export type User_Me_Set_Password_Validation_Type = z.infer<typeof user_me_set_password_validation_doc>;
export type TUserMeSetPasswordValidation = User_Me_Set_Password_Validation_Type;

export const user_me_update_password_validation_doc = z.object({
    current_password: user_common_doc.user_password_before_hash_doc,
    password: user_common_doc.user_password_before_hash_doc,
    confirm_password: user_common_doc.user_password_before_hash_doc,
}).strict().superRefine((data, ctx) => {
    if (data.password !== data.confirm_password) {
        ctx.addIssue({
            code: "custom",
            message: "Passwords do not match",
            path: ["confirm_password"],
        });
    }
});

export type User_Me_Update_Password_Validation_Type = z.infer<typeof user_me_update_password_validation_doc>;
export type TUserMeUpdatePasswordValidation = User_Me_Update_Password_Validation_Type;
