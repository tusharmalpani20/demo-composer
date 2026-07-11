import type { FastifyRequest } from "fastify";
import { web_session_cookie_name } from "./session-cookie";

const bearer_prefix = "bearer ";

export const session_token_from_request = (request: FastifyRequest) => {
  const authorization = request.headers.authorization;

  if (authorization?.toLowerCase().startsWith(bearer_prefix)) {
    const token = authorization.slice(bearer_prefix.length).trim();

    if (token) {
      return token;
    }
  }

  return request.cookies[web_session_cookie_name];
};

export const is_extension_client_request = (request: FastifyRequest) => (
  request.headers["x-ossie-client"] === "extension"
);
