import { CustomError } from "./custom_error";
import {
  Api_Error_Response_Type,
  response_message,
} from "@repo/types";
import { general_error_message } from "../constants/error_message.constant";

export class NotFoundError extends CustomError {
  code = general_error_message.request_not_found.code;
  type = general_error_message.request_not_found.type;
  message = response_message.enum.error;
  result: Api_Error_Response_Type[] = [
    {
      message: general_error_message.request_not_found.message,
      type: general_error_message.request_not_found.type,
      field: "",
    },
  ];
  constructor(public path: string, public timestamp: string | Date = new Date().toISOString()) {
    super(response_message.enum.error);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors() {
    return {
      code: this.code,
      message: this.message,
      path: this.path,
      result: this.result,
      timestamp: this.timestamp,
    };
  }
}
