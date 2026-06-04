import { CustomError } from "./custom_error";
import {
  Api_Error_Response_Type,
  response_message,
} from "@repo/types";
import { general_error_message } from "../constants/error_message.constant";

export class DatabaseConnectionError extends CustomError {
  code = general_error_message.database_connection_error.code;
  type = general_error_message.database_connection_error.type;
  message = response_message.enum.error;
  path = "";

  result: Api_Error_Response_Type[] = [
    {
      message: general_error_message.database_connection_error.message,
      type: general_error_message.database_connection_error.type,
      field: "",
    },
  ];
  constructor(public error_message: string, public timestamp: string | Date = new Date().toISOString()) {
    super(response_message.enum.error);

    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
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
