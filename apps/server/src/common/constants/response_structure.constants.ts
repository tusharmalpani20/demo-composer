import { z } from "zod";
import { response_message } from "@repo/types";

export { response_message };

const service_success_response = z.object({
  code: z.number().int().positive(),
  status: z.enum([response_message.enum.success, response_message.enum.info]),
  result: z.any(),
});

const service_error_response_structure = z.object({
  code: z.number().int().positive(),
  status: z.enum([response_message.enum.error, response_message.enum.warning]),
  error_message: z.string(),
  error_type: z.string(),
  error_response: z.any(),
});

export type Service_Success_Response_Type = z.infer<
  typeof service_success_response
>;

export type Service_Error_Response_Type = z.infer<
  typeof service_error_response_structure
>;

export type Service_Response_Structure_Type =
  | z.infer<typeof service_success_response>
  | z.infer<typeof service_error_response_structure>;
