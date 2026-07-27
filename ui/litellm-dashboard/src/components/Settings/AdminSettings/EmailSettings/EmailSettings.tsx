"use client";

import React, { useEffect, useState } from "react";
import { Card, Title, Text } from "@tremor/react";
import { Form, Input, InputNumber, Select, Switch, Button, Modal, Spin, notification } from "antd";
import {
  getEmailSettingsCall,
  updateEmailSettingsCall,
  testEmailSettingsCall,
} from "@/components/networking";

interface EmailSettingsProps {
  accessToken: string | null;
}

const EmailSettings: React.FC<EmailSettingsProps> = ({ accessToken }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  const fetchEmailSettings = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const settings = await getEmailSettingsCall(accessToken);
      setPasswordSet(settings.smtp_password_set);
      form.setFieldsValue({
        email_provider: settings.email_provider || "smtp-generic",
        smtp_host: settings.smtp_host || "",
        smtp_port: settings.smtp_port || 587,
        smtp_username: settings.smtp_username || "",
        smtp_sender_email: settings.smtp_sender_email || "",
        smtp_tls: settings.smtp_tls,
        smtp_password: "",
      });
    } catch (error) {
      notification.error({ message: "Error", description: "Failed to load email settings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSubmit = async (values: {
    email_provider: string;
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password?: string;
    smtp_sender_email: string;
    smtp_tls: boolean;
  }) => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const updated = await updateEmailSettingsCall(accessToken, {
        smtp_host: values.smtp_host,
        smtp_port: Number(values.smtp_port),
        smtp_username: values.smtp_username,
        // Only send the password when the admin actually typed a new one
        smtp_password: values.smtp_password ? values.smtp_password : undefined,
        smtp_sender_email: values.smtp_sender_email,
        smtp_tls: values.smtp_tls,
        email_provider: values.email_provider,
      });
      setPasswordSet(updated.smtp_password_set);
      form.setFieldValue("smtp_password", "");
      notification.success({ message: "Success", description: "Email settings saved" });
    } catch (error) {
      notification.error({
        message: "Error",
        description: error instanceof Error ? error.message : "Failed to save email settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!accessToken || !testEmail) {
      notification.warning({ message: "Warning", description: "Enter a recipient email" });
      return;
    }
    setTestLoading(true);
    try {
      await testEmailSettingsCall(accessToken, testEmail);
      notification.success({ message: "Success", description: `Test email sent to ${testEmail}` });
      setTestModalOpen(false);
      setTestEmail("");
    } catch (error) {
      notification.error({
        message: "Error",
        description: error instanceof Error ? error.message : "Failed to send test email",
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin />
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <Title>Email Settings</Title>
      <Text>Configure SMTP email delivery. MailJet works through its SMTP relay (in-v3.mailjet.com, API key and secret as username and password).</Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-6"
        initialValues={{ email_provider: "smtp-generic", smtp_port: 587, smtp_tls: true }}
      >
        <Form.Item label="Email Provider" name="email_provider">
          <Select
            options={[
              { value: "smtp-generic", label: "SMTP Generic" },
              { value: "mailjet", label: "MailJet" },
            ]}
          />
        </Form.Item>

        <Form.Item label="SMTP Host" name="smtp_host" rules={[{ required: true, message: "SMTP host is required" }]}>
          <Input placeholder="e.g., in-v3.mailjet.com" />
        </Form.Item>

        <Form.Item label="SMTP Port" name="smtp_port" rules={[{ required: true, message: "SMTP port is required" }]}>
          <InputNumber className="w-full" placeholder="587" />
        </Form.Item>

        <Form.Item label="Sender Email" name="smtp_sender_email" rules={[{ required: true, message: "Sender email is required" }]}>
          <Input placeholder="sender@example.com" />
        </Form.Item>

        <Form.Item label="Username" name="smtp_username">
          <Input placeholder="SMTP username / MailJet API key" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="smtp_password"
          extra={
            passwordSet
              ? "A password is already saved. Leave blank to keep it, or type a new one to replace it."
              : "SMTP password / MailJet secret key. Encrypted at rest and never returned."
          }
        >
          <Input.Password
            autoComplete="new-password"
            placeholder={passwordSet ? "•••••••• (unchanged)" : "Enter password"}
          />
        </Form.Item>

        <Form.Item label="Use TLS/STARTTLS" name="smtp_tls" valuePropName="checked">
          <Switch />
        </Form.Item>

        <div className="flex gap-3 mt-4">
          <Button type="primary" htmlType="submit" loading={saving}>
            Save Settings
          </Button>
          <Button onClick={() => setTestModalOpen(true)}>Send Test Email</Button>
        </div>
      </Form>

      <Modal
        title="Send Test Email"
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        onOk={handleTestEmail}
        confirmLoading={testLoading}
        okText="Send"
      >
        <Text>Sends a test email using the currently saved settings.</Text>
        <Input
          className="mt-3"
          placeholder="recipient@example.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
        />
      </Modal>
    </Card>
  );
};

export default EmailSettings;
