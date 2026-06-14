import { describe, expect, it } from "vitest";
import {
  hash_public_link_password,
  verify_public_link_password,
} from "./public-link-password";

describe("public link password helpers", () => {
  it("hashes public link passwords with unique salts and verifies them", async () => {
    const first = await hash_public_link_password("shared password");
    const second = await hash_public_link_password("shared password");

    expect(first.hash).not.toBe("shared password");
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    await expect(verify_public_link_password("shared password", first.hash, first.salt)).resolves.toBe(true);
    await expect(verify_public_link_password("wrong password", first.hash, first.salt)).resolves.toBe(false);
  });
});
