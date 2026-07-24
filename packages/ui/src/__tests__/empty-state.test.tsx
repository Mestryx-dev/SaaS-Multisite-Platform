import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState } from "../components/empty-state";

afterEach(() => cleanup());

describe("EmptyState", () => {
  it("renders children as description fallback", () => {
    render(<EmptyState>Nothing here</EmptyState>);
    expect(screen.getByRole("status").textContent).toContain("Nothing here");
  });

  it("renders title description and action", () => {
    render(
      <EmptyState
        title="Empty"
        description="Add one"
        action={<button type="button">Create</button>}
      />,
    );
    expect(screen.getByText("Empty")).toBeTruthy();
    expect(screen.getByText("Add one")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create" })).toBeTruthy();
  });

  it("renders icon when provided", () => {
    render(
      <EmptyState
        icon={<span data-testid="empty-icon">🔍</span>}
        title="No results"
      />,
    );
    expect(screen.getByTestId("empty-icon")).toBeTruthy();
  });
});
