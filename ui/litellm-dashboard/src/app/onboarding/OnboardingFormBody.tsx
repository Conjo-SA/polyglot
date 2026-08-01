import React from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";

type OnboardingFormBodyProps = {
  variant: "signup" | "reset_password";
  userEmail: string;
  isPending: boolean;
  claimError: string | null;
  onSubmit: (values: { password: string }) => void;
};

export function OnboardingFormBody({ variant, userEmail, isPending, claimError, onSubmit }: OnboardingFormBodyProps) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (userEmail) form.setFieldValue("user_email", userEmail);
  }, [userEmail, form]);

  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Card>
        <Typography.Title level={5} className="text-center mb-5">
          🌐 Polyglot
        </Typography.Title>
        <Typography.Title level={3}>{variant === "reset_password" ? "Redefinir Senha" : "Criar Conta"}</Typography.Title>
        <Typography.Text>
          {variant === "reset_password"
            ? "Redefina sua senha para acessar a interface de administração."
            : "Reivindique sua conta de usuário para fazer login na interface de administração."}
        </Typography.Text>

        {variant === "signup" && (
          <Alert
            className="mt-4"
            type="info"
            message="SSO"
            description={
              <div className="flex justify-between items-center">
                <span>SSO está disponível no plano Enterprise.</span>
                <Button type="primary" size="small" href="https://forms.gle/W3U4PZpJGFHWtHyA9" target="_blank">
                  Teste Grátis
                </Button>
              </div>
            }
            showIcon
          />
        )}

        <Form
          className="mt-10 mb-5"
          layout="vertical"
          form={form}
          onFinish={(values) => onSubmit({ password: values.password })}
        >
          <Form.Item label="Endereço de E-mail" name="user_email">
            <Input type="email" disabled />
          </Form.Item>

          <Form.Item
            label="Senha"
            name="password"
            rules={[{ required: true, message: "senha obrigatória para criar conta" }]}
            help={variant === "reset_password" ? "Digite sua nova senha" : "Crie uma senha para sua conta"}
          >
            <Input.Password />
          </Form.Item>

          {claimError && <Alert type="error" message={claimError} showIcon className="mb-4" />}

          <div className="mt-10">
            <Button htmlType="submit" loading={isPending}>
              {variant === "reset_password" ? "Redefinir Senha" : "Criar Conta"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
