import type { FastifyReply } from "fastify";

export const public_viewer_cookie_name = "ossie_public_viewer";

export const public_viewer_cookie_options = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

export const set_public_viewer_cookie = (
  reply: FastifyReply,
  token: string,
  expires_at: string
) => {
  reply.setCookie(public_viewer_cookie_name, token, {
    ...public_viewer_cookie_options,
    expires: new Date(expires_at),
  });
};
