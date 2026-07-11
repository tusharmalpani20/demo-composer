import { describe, expect, it } from "vitest";
import { quote_database_identifier } from "./identifier";

describe("database identifier helpers", () => {
  it("quotes database identifiers and escapes embedded quotes", () => {
    expect(quote_database_identifier("ossie_test")).toBe('"ossie_test"');
    expect(quote_database_identifier('test-"dc"')).toBe('"test-""dc"""');
  });
});
