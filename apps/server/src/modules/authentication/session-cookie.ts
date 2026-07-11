import type { FastifyReply } from "fastify";

export const web_session_cookie_name = "ossie_session";

export const web_session_cookie_options = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

export const set_web_session_cookie = (reply: FastifyReply, session_token: string) => {
  reply.setCookie(web_session_cookie_name, session_token, web_session_cookie_options);
};

export const clear_web_session_cookie = (reply: FastifyReply) => {
  reply.clearCookie(web_session_cookie_name, {
    path: web_session_cookie_options.path,
  });
};
