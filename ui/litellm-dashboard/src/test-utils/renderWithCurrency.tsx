import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

export function renderWithCurrency(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: CurrencyProvider, ...options });
}