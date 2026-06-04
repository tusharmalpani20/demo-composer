import {
  Response_Message_Type,
  Api_Error_Response_Type,
} from "@repo/types";

export abstract class CustomError extends Error {
  abstract readonly code: number;
  abstract readonly type: string;
  abstract readonly message: Response_Message_Type;
  abstract readonly path: string;
  abstract readonly result: Api_Error_Response_Type[];
  abstract readonly timestamp: string | Date;
  constructor(message: Response_Message_Type) {
    super(message);

    Object.setPrototypeOf(this, CustomError.prototype);
  }

  //abstract serializeErrors(): { message: string; field?: string ;  }[];
  abstract serializeErrors(): {
    code: number;
    path: string;
    message: string;
    //result is array of errors over here
    result: Api_Error_Response_Type[];
    timestamp: string | Date;
  };
}
