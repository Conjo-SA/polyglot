"use client";

import React from "react";
import Link from "next/link";
import { Alert } from "antd";

const DEPRECATION_DISCUSSION_URL = "https://github.com/BerriAI/litellm/discussions/32090";
const DEPRECATION_TARGET_DATE = "September 1, 2026";

interface DeprecationBannerProps {
  featureName: string;
}

export const DeprecationBanner: React.FC<DeprecationBannerProps> = ({ featureName }) => (
  <Alert
    message={`${featureName} está em uma lista de depreciação provisória`}
    description={
      <>
        {`${featureName} é uma das várias funcionalidades experimentais que estamos considerando remover, potencialmente tão cedo quanto ${DEPRECATION_TARGET_DATE}. Esta lista é uma versão provisória e não é definitiva. Se você depende desta funcionalidade, por favor compartilhe seu feedback na `}
        <Link href={DEPRECATION_DISCUSSION_URL} target="_blank" rel="noopener noreferrer">
          discussão sobre depreciação
        </Link>
        .
      </>
    }
    type="info"
    showIcon
    closable
    style={{ marginBottom: 16 }}
  />
);
