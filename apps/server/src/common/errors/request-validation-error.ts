import { CustomError } from "./custom_error";
import {
  Api_Error_Response_Type,
  response_message,
} from "@repo/types";
import { general_error_message } from "../constants/error_message.constant";

export class RequestValidationError extends CustomError {
  code = general_error_message.validation_error.code;
  type = general_error_message.validation_error.type;
  message = response_message.enum.error;

  constructor(
    public result: Api_Error_Response_Type[],
    public path: string,
    public timestamp: string | Date = new Date().toISOString()
  ) {
    super(response_message.enum.error);

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, RequestValidationError.prototype);
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
