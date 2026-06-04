import { common_page_size } from "@repo/constants";
import z from "zod";

export const ulid_doc = z.ulid();
export type ULID_Type = z.infer<typeof ulid_doc>;
export type TUlid = ULID_Type;

export const uuid_doc = z.uuid();
export type UUID_Type = z.infer<typeof uuid_doc>;
export type TUuid = UUID_Type;

export const int_doc = z.coerce.number().int();
export type Int_Type = z.infer<typeof int_doc>;
export type TInt = Int_Type;

export const positive_int_doc = z.coerce.number().int().min(0);
export type Positive_Int_Type = z.infer<typeof positive_int_doc>;
export type TPositiveInt = Positive_Int_Type;

export const version_doc = z.coerce.number().int().min(1);
export type Version_Type = z.infer<typeof version_doc>;
export type TVersion = Version_Type;

export const float_doc = z.coerce.number();
export type Float_Type = z.infer<typeof float_doc>;
export type TFloat = Float_Type;

export const positive_float_doc = z.coerce.number().min(0);
export type Positive_Float_Type = z.infer<typeof positive_float_doc>;
export type TPositiveFloat = Positive_Float_Type;

export const boolean_doc = z.coerce.boolean();
export type Boolean_Type = z.infer<typeof boolean_doc>;
export type TBoolean = Boolean_Type;

export const boolean_preprocess_doc = z.preprocess(
    (value) => (value === "true" || value === "1" ? true : false),
    z.boolean()
);
export type Boolean_Preprocess_Type = z.infer<typeof boolean_preprocess_doc>;
export type TBooleanPreprocess = Boolean_Preprocess_Type;

export const name_preprocess_doc = z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(1).max(255)
);
export type Name_Preprocess_Type = z.infer<typeof name_preprocess_doc>;
export type TNamePreprocess = Name_Preprocess_Type;

export const date_doc = z.coerce.date();
export type Date_Type = z.infer<typeof date_doc>;
export type TDate = Date_Type;

export const page_number_doc = z.coerce.number().int().positive().default(1);
export type Page_Number_Type = z.infer<typeof page_number_doc>;
export type TPageNumber = Page_Number_Type;

export const page_count_doc = z.number().int().min(0);
export type Page_Count_Type = z.infer<typeof page_count_doc>;
export type TPageCount = Page_Count_Type;

export const page_size_doc = z.coerce
    .number()
    .int()
    .positive()
    .default(common_page_size);
export type Page_Size_Type = z.infer<typeof page_size_doc>;
export type TPageSize = Page_Size_Type;

//can be used with multer
export const upload_file_doc = z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    buffer: z.any(),
    size: z.number(),
});
export type Upload_File_Type = z.infer<typeof upload_file_doc>;
export type TUploadFile = Upload_File_Type;

export const file_path_doc = z.string().min(2).max(255);
export type File_Path_Type = z.infer<typeof file_path_doc>;
export type TFilePath = File_Path_Type;

export const email_doc = z.email();
export type Email_Type = z.infer<typeof email_doc>;
export type TEmail = Email_Type;

//TODO : add phone validation
export const phone_doc = z.string().min(10).max(15);
export type Phone_Type = z.infer<typeof phone_doc>;
export type TPhone = Phone_Type;

export const phone_country_code_doc = z.string().min(1).max(10);
export type Phone_Country_Code_Type = z.infer<typeof phone_country_code_doc>;
export type TPhoneCountryCode = Phone_Country_Code_Type;

export const timezone_doc = z.string().regex(
    /^[A-Z][a-z]+\/[A-Z][a-zA-Z_]+$/,
    "Invalid IANA timezone format (e.g., America/New_York, Europe/London)"
).max(50);
export type Timezone_Type = z.infer<typeof timezone_doc>;
export type TTimezone = Timezone_Type;

export const country_code_doc = z.string().min(2).max(2);
export type Country_Code_Type = z.infer<typeof country_code_doc>;
export type TCountryCode = Country_Code_Type;

export const currency_code_doc = z.string().min(3).max(3);
export type Currency_Code_Type = z.infer<typeof currency_code_doc>;
export type TCurrencyCode = Currency_Code_Type;

export const order_by_enum = z.enum(["asc", "desc"]);
export type Order_By_Enum = z.infer<typeof order_by_enum>;
export type EOrderBy = Order_By_Enum;

export const create_order_by_doc = (field_enum: z.ZodType<string>) => {
    return z.string().refine((val) => {
        const pairs = val.split(",");
        return pairs.every((pair) => {
            const parts = pair.split(":");
            if (parts.length !== 2) return false;
            const [field, direction] = parts;
            return field_enum.safeParse(field).success && order_by_enum.safeParse(direction).success;
        });
    }, {
        message: "Invalid order_by format. Expected: field:direction (e.g. name:asc,created_at:desc)"
    });
};


//common multipart file and field doc
export const multipart_file_doc = z.object({
    type: z.literal('file'),
    toBuffer: z.function({
        input: [],
        output: z.promise(z.instanceof(Buffer))
    }),
    file: z.any(),
    fieldname: z.string(),
    filename: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    filepath: z.string(),
    generated_file_name: z.string(),
    file_extension: z.string(),
    file_id: ulid_doc
});
export type Multipart_File_Type = z.infer<typeof multipart_file_doc>;

export const multipart_field_doc = <T>(value_doc: z.ZodType<T>) => z.object({
    type: z.literal('field'),
    value: value_doc,
    fieldname: z.string(),
    mimetype: z.string(),
    encoding: z.string(),
    fieldnameTruncated: z.boolean(),
    valueTruncated: z.boolean(),
});
export type Multipart_Field_Type<T> = z.infer<ReturnType<typeof multipart_field_doc<T>>>;


export const hex_color_doc = z.string().regex(/^#([0-9a-fA-F]{6})$/);
export type Hex_Color_Type = z.infer<typeof hex_color_doc>;
export type THexColor = Hex_Color_Type;


export const comma_separated_ulids_doc = z.string()
.transform((val) => val.split(",").map((v) => v.trim()).filter((v) => ulid_doc.safeParse(v).success))
.pipe(z.array(ulid_doc))
.describe("Comma-separated list of ULIDs");

export type Comma_Separated_Ulids_Type = z.infer<typeof comma_separated_ulids_doc>;
export type TCommaSeparatedUlids = Comma_Separated_Ulids_Type;

export const common_detail_params_doc = z.object({
    id: ulid_doc,
});
export type Common_Detail_Params_Type = z.infer<typeof common_detail_params_doc>;
export type TCommonDetailParams = Common_Detail_Params_Type;