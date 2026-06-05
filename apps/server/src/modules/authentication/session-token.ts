import { createHash, randomBytes } from "node:crypto";

export const generate_session_token = () => randomBytes(32).toString("base64url");

export const hash_session_token = (token: string) => (
  createHash("sha256").update(token).digest("hex")
);
