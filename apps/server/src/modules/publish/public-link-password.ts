import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt_async = promisify(scrypt);
const key_length = 64;

export const hash_public_link_password = async (password: string) => {
  const salt = randomBytes(16).toString("base64url");
  const derived = await scrypt_async(password, salt, key_length) as Buffer;

  return {
    hash: derived.toString("base64url"),
    salt,
  };
};

export const verify_public_link_password = async (
  password: string,
  hash: string,
  salt: string
) => {
  const expected = Buffer.from(hash, "base64url");
  const actual = await scrypt_async(password, salt, expected.length) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
