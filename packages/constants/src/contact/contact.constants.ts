import { z } from "zod";

export const contact_type_enum_doc = z.enum([
    "lead",
    "customer",
    "partner",
    "other",
]);

export const EContactType = contact_type_enum_doc;

export type Contact_Type_Enum = z.infer<typeof contact_type_enum_doc>;
export type TContactType = Contact_Type_Enum;
