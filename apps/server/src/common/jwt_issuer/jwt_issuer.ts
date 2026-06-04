import { ULID_Type, User_Type } from "@repo/types";
import * as fs from "fs";
import jsonwebtoken from "jsonwebtoken";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const path_to_files = "../../..";

export const pathToKey = path.join(__dirname, path_to_files, "id_rsa_priv.pem");

const PRIV_KEY = fs.readFileSync(pathToKey, "utf8");

const add_days_to_date = (date: Date, days: number) => {
  let result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const issue_jwt = (user: User_Type, session_id: ULID_Type, expires_in_days: number = 30): { token: string, expires_in: Date } => {
  const expires_in = `${expires_in_days}d`;
  let expires_in_date = add_days_to_date(new Date(), expires_in_days);

  /*
        //copied from old code : here we will be setting the time zone in .env and get the according to that

        have to do this in IST 
        (once have a look after completing the code)

        expires_in_date = new Date().toLocaleString(undefined, {timeZone: 'Asia/Kolkata'});

        new Date().toLocaleString('en-US', {timeZone: 'Asia/Kolkata'})
    */

  const payload = {
    sub: session_id,
    iat: Math.floor(Date.now() / 1000), // https://stackoverflow.com/questions/62610488/passportjs-validates-expired-jwt
  };

  const signed_token = jsonwebtoken.sign(
    payload,
    PRIV_KEY as any,  // This should be of type Secret | PrivateKey
    {
      expiresIn: expires_in,
      algorithm: "RS256" as const,
    } as any
  );

  return {
    token: "Bearer " + signed_token,
    expires_in: expires_in_date,
  };
};



export const path_to_pub_key = path.join(
  __dirname,
  path_to_files,
  "id_rsa_pub.pem"
);

const PUB_KEY = fs.readFileSync(path_to_pub_key, "utf8");

export const verify_issued_jwt_token = (token: string) => {
  try {
    const result = jsonwebtoken.verify(token, PUB_KEY, {
      algorithms: ["RS256"],
    }) as {
      sub: string;
      iat: number;
      exp: number;
    };

    //if the token is expired the return false else return true
    if (new Date().getTime() > result.exp * 1000) {
      return false;
    }
    return {
      user_id: result.sub,
    };
  } catch (error) {
    return false;
  }
};