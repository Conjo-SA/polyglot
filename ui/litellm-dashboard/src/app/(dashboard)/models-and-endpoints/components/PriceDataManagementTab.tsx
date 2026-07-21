import { TabPanel, Text, Title } from "@tremor/react";
import PriceDataReload from "@/components/price_data_reload";
import React from "react";
import { useTranslation } from "react-i18next";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useModelCostMap } from "../../hooks/models/useModelCostMap";

const PriceDataManagementTab = () => {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const { refetch: refetchModelCostMap } = useModelCostMap();

  return (
    <TabPanel>
      <div className="p-6">
        <div className="mb-6">
          <Title>{t("priceDataManagement.title")}</Title>
          <Text className="text-tremor-content">{t("priceDataManagement.subtitle")}</Text>
        </div>
        <PriceDataReload
          accessToken={accessToken}
          onReloadSuccess={() => {
            refetchModelCostMap();
          }}
          buttonText={t("priceDataManagement.reloadButton")}
          size="middle"
          type="primary"
          className="w-full"
        />
      </div>
    </TabPanel>
  );
};

export default PriceDataManagementTab;
