import {
  Response_Message_Type,
  Api_Error_Response_Type,
} from "@repo/types";
import { CustomError } from "./custom_error";

export class GeneralError extends CustomError {
  constructor(
    public code: number,
    public type: string,
    public path: string,
    public message: Response_Message_Type,
    public result: Api_Error_Response_Type[],
    public timestamp: string | Date = new Date().toISOString()
  ) {
    super(message);
    Object.setPrototypeOf(this, GeneralError.prototype);
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
