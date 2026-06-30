import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge } from "./badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Separator } from "./separator";
import { Textarea } from "./textarea";

describe("shared UI primitives", () => {
  it("renders form primitives with accessible labels and caller classes", () => {
    render(
      <form>
        <Label htmlFor="name">Project name</Label>
        <Input className="name-input" id="name" defaultValue="Launch demo" />
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" defaultValue="Internal walkthrough" />
      </form>
    );

    expect(screen.getByLabelText("Project name")).toHaveClass("name-input");
    expect(screen.getByLabelText("Notes")).toHaveValue("Internal walkthrough");
  });

  it("renders content primitives without hiding semantic content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Capture session</CardTitle>
          <CardDescription>Ready to publish</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="success">Complete</Badge>
          <Alert>
            <AlertTitle>Review complete</AlertTitle>
            <AlertDescription>No blocking issues found.</AlertDescription>
          </Alert>
          <Separator />
        </CardContent>
      </Card>
    );

    expect(screen.getByText("Capture session")).toBeInTheDocument();
    expect(screen.getByText("Ready to publish")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Review complete")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});
