import React from "react";
import { Alert, Button } from "antd";
import { getLoginUrl } from "@/utils/returnUrlUtils";

export function OnboardingErrorView() {
  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Alert
        type="error"
        message="Falha ao carregar convite"
        description="O link de convite pode ser inválido ou expirado."
        showIcon
      />
      <div className="mt-4">
        <Button href={getLoginUrl()}>Voltar para o Login</Button>
      </div>
    </div>
  );
}
