"use client";

import React, { useEffect, useRef } from "react";
import { ConfigProvider, notification, message } from "antd";
import ptBR from "antd/locale/pt_BR";
import enUS from "antd/locale/en_US";
import { StyleProvider } from "@ant-design/cssinjs";
import { setNotificationInstance } from "@/components/molecules/notifications_manager";
import { setMessageInstance } from "@/components/molecules/message_manager";
import { useLanguage } from "@/contexts/I18nProvider";

export default function AntdGlobalProvider({ children }: { children: React.ReactNode }) {
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [messageApi, messageContextHolder] = message.useMessage();
  const initialized = useRef(false);
  const { language } = useLanguage();

  useEffect(() => {
    if (!initialized.current) {
      setNotificationInstance(notificationApi);
      setMessageInstance(messageApi);
      initialized.current = true;
    }
  }, [notificationApi, messageApi]);

  // Keeps antd's own built-in copy (table "No data", pagination, popconfirm
  // buttons, date pickers, etc.) in sync with the app language.
  const antdLocale = language === "pt-BR" ? ptBR : enUS;

  return (
    <StyleProvider layer>
      <ConfigProvider theme={{ cssVar: true }} locale={antdLocale}>
        {notificationContextHolder}
        {messageContextHolder}
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
