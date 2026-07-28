import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyMoneyInput } from "./CurrencyMoneyInput";
import { useCurrency } from "@/contexts/CurrencyContext";

// Mock the context
jest.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: jest.fn(),
}));

describe("CurrencyMoneyInput", () => {
  const mockUseCurrency = useCurrency as jest.Mock;

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

  it("converts BRL value to display value correctly", () => {
    mockUseCurrency.mockReturnValue({
      currency: "BRL",
      rate: 5.3,
      symbol: "R$",
    });
    
    render(<CurrencyMoneyInput value={100} />);
    
    // Should show the converted value (100 * 5.3 = 530)
    expect(screen.getByRole("spinbutton")).toHaveValue(530);
  });

  it("calls onChange with USD value when BRL input changes", () => {
    const handleChange = jest.fn();
    
    mockUseCurrency.mockReturnValue({
      currency: "BRL",
      rate: 5.3,
      symbol: "R$",
    });
    
    render(<CurrencyMoneyInput value={100} onChange={handleChange} />);
    
    const input = screen.getByRole("spinbutton");
    
    // Change the display value from 530 (100*5.3) to 10
    fireEvent.change(input, { target: { value: "10" } });
    
    // Should call onChange with USD equivalent: 10 / 5.3 = 1.89
    expect(handleChange).toHaveBeenCalledWith(Number((10 / 5.3).toFixed(6)));
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