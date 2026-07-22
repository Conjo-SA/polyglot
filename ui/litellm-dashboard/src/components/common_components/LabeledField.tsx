import React from "react";
import { Typography, Space } from "antd";
import { useTranslation } from "react-i18next";
import DefaultProxyAdminTag from "./DefaultProxyAdminTag";

const { Text } = Typography;

interface LabeledFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  truncate?: boolean;
  copyable?: boolean;
  defaultUserIdCheck?: boolean;
}

export default function LabeledField({
  label,
  value,
  icon,
  truncate = false,
  copyable = false,
  defaultUserIdCheck = false,
}: LabeledFieldProps) {
  const { t } = useTranslation();
  const isEmpty = !value;
  const isDefaultUser = defaultUserIdCheck && value === "default_user_id";
  const displayValue = isEmpty ? "-" : value;
  const isCopyable = copyable && !isEmpty && !isDefaultUser;

  const valueEl = isDefaultUser ? (
    <DefaultProxyAdminTag userId={value} />
  ) : (
    <Text
      strong
      copyable={isCopyable ? { tooltips: [t("labeledField.copyLabel", { label }), t("keyInfoHeader.copiedExclaim")] } : false}
      ellipsis={truncate}
      style={truncate ? { maxWidth: 160, display: "block" } : undefined}
    >
      {displayValue}
    </Text>
  );
  return (
    <div>
      <Space size={4}>
        <Text type="secondary">{icon}</Text>
        <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </Text>
      </Space>
      <div>{valueEl}</div>
    </div>
  );
}
