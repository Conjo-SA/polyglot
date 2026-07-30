import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CurrencyMoneyInput } from "./CurrencyMoneyInput";
import { useCurrency } from "@/contexts/CurrencyContext";

// Mock the context
vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: vi.fn(),
}));

describe("CurrencyMoneyInput", () => {
  const mockUseCurrency = useCurrency as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUseCurrency.mockReturnValue({
      currency: "USD",
      rate: 5.3,
      symbol: "$",
    });
  });

  it("renders input with USD symbol by default", () => {
    render(<CurrencyMoneyInput value={100} />);
    
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("converts USD value to BRL display value correctly", () => {
    mockUseCurrency.mockReturnValue({
      currency: "BRL",
      rate: 5.3,
      symbol: "R$",
    });
    
    render(<CurrencyMoneyInput value={100} />);
    
    // 100 USD * 5.3 = 530 BRL (comportamento correto)
    expect(screen.getByRole("spinbutton")).toHaveValue("530");
  });

  it("calls onChange with USD value when BRL input changes", () => {
    const handleChange = vi.fn();
    
    mockUseCurrency.mockReturnValue({
      currency: "BRL",
      rate: 5.3,
      symbol: "R$",
    });
    
    render(<CurrencyMoneyInput value={100} onChange={handleChange} />);
    
    const input = screen.getByRole("spinbutton");
    
    // Usuário digita 53 (BRL) → deve virar 10 USD (53 / 5.3)
    fireEvent.change(input, { target: { value: "53" } });
    
    // Deve chamar onChange com o valor em USD equivalente: 53 / 5.3 = 10
    expect(handleChange).toHaveBeenCalledWith(10);
  });

  it("properly displays rate conversion info for BRL", () => {
    mockUseCurrency.mockReturnValue({
      currency: "BRL",
      rate: 5.3,
      symbol: "R$",
    });
    
    render(<CurrencyMoneyInput value={100} />);
    
    // Should show the rate conversion information
    expect(screen.getByText("≈ $100.00 USD (taxa 5.30)")).toBeInTheDocument();
  });
});