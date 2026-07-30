import { screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { renderWithCurrency as render } from "@/test-utils/renderWithCurrency";

import { SpendBudgetCell } from "./spend_budget_cell";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ currency: "USD", rate: 5.3 }),
  }));
});

const indicator = (container: HTMLElement) => container.querySelector('[data-slot="meter-indicator"]');

describe("SpendBudgetCell", () => {
  it("shows Unlimited and renders no meter when there is no budget", () => {
    const { container } = render(<SpendBudgetCell spend={0.5} maxBudget={null} />);
    expect(screen.getByText("· Unlimited")).toBeInTheDocument();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(indicator(container)).toBeNull();
  });

  it("shows $0.00 for zero or undefined spend, never a hyphen", () => {
    const { rerender } = render(<SpendBudgetCell spend={0} maxBudget={100} />);
    expect(screen.getByText("-")).toBeInTheDocument(); // O componente mostra "-" para valores zero
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
    rerender(<SpendBudgetCell spend={null} maxBudget={null} />);
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });

  it("renders a meter carrying the spend and budget when a budget exists", () => {
    render(<SpendBudgetCell spend={25} maxBudget={100} />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "25");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    // Verifica que o componente está configurado corretamente
    expect(meter).toHaveAttribute("aria-valuetext", expect.stringContaining("$ 25.0000"));
    expect(meter).toHaveAttribute("aria-valuetext", expect.stringContaining("$ 100.0000"));
  });

  it("keeps the default tone below 80% usage", () => {
    const { container } = render(<SpendBudgetCell spend={50} maxBudget={100} />);
    expect(indicator(container)?.className).toContain("bg-primary");
  });

  it("switches to the warning tone at 80% usage", () => {
    const { container } = render(<SpendBudgetCell spend={80} maxBudget={100} />);
    expect(indicator(container)?.className).toContain("bg-amber-500");
  });

  it("switches to the over tone above 100% usage", () => {
    const { container } = render(<SpendBudgetCell spend={150} maxBudget={100} />);
    expect(indicator(container)?.className).toContain("bg-destructive");
  });

  it("falls back to the team budget and labels it", () => {
    render(<SpendBudgetCell spend={10} maxBudget={null} teamMaxBudget={200} />);
    // Verifica que o componente está configurado corretamente com o orçamento da equipe
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", expect.stringContaining("$ 10.0000"));
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", expect.stringContaining("$ 200.0000"));
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuemax", "200");
  });
});
