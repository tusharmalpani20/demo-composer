import { describe, expect, it } from "vitest";
import { quote_database_identifier } from "./identifier";

describe("database identifier helpers", () => {
  it("quotes database identifiers and escapes embedded quotes", () => {
    expect(quote_database_identifier("demo_composer_test")).toBe('"demo_composer_test"');
    expect(quote_database_identifier('test-"dc"')).toBe('"test-""dc"""');
  });
});
