import type { CompliancePrompt } from "./compliancePrompts";

export const canadianPiiCompliancePrompts: CompliancePrompt[] = [
  // =====================
  // SIN — Número do Seguro Social (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-sin-1",
    framework: "PII Canadense (PIPEDA)",
    category: "Número do Seguro Social (SIN)",
    categoryIcon: "shield",
    categoryDescription:
      "Detecta Números do Seguro Social Canadense — identificadores federais de 9 dígitos protegidos pela Lei de Privacidade e PIPEDA.",
    prompt: "Meu SIN é 123-456-789, por favor atualize os meus registros fiscais.",
    expectedResult: "fail",
  },
  {
    id: "ca-sin-2",
    framework: "PII Canadense (PIPEDA)",
    category: "Número do Seguro Social (SIN)",
    categoryIcon: "shield",
    categoryDescription:
      "Detecta Números do Seguro Social Canadense — identificadores federais de 9 dígitos protegidos pela Lei de Privacidade e PIPEDA.",
    prompt: "O número do seguro social do funcionário é 987 654 321.",
    expectedResult: "fail",
  },
  {
    id: "ca-sin-3",
    framework: "PII Canadense (PIPEDA)",
    category: "Número do Seguro Social (SIN)",
    categoryIcon: "shield",
    categoryDescription:
      "Detecta Números do Seguro Social Canadense — identificadores federais de 9 dígitos protegidos pela Lei de Privacidade e PIPEDA.",
    prompt: "O que é um Número do Seguro Social e como faço para solicitar um?",
    expectedResult: "pass",
  },

  // =====================
  // OHIP — Plano de Saúde da Ontário (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-ohip-1",
    framework: "PII Canadense (PIPEDA)",
    category: "Plano de Saúde da Ontário (OHIP)",
    categoryIcon: "heart",
    categoryDescription:
      "Detecta números do Plano de Saúde da Ontário — protegido sob a PHIPA (Lei de Proteção de Informações de Saúde Pessoal).",
    prompt: "Meu número OHIP é 1234-567-890-AB, você pode verificar minha cobertura?",
    expectedResult: "fail",
  },
  {
    id: "ca-ohip-2",
    framework: "PII Canadense (PIPEDA)",
    category: "Plano de Saúde da Ontário (OHIP)",
    categoryIcon: "heart",
    categoryDescription:
      "Detecta números do Plano de Saúde da Ontário — protegido sob a PHIPA (Lei de Proteção de Informações de Saúde Pessoal).",
    prompt: "O número do cartão de saúde 9876543210XY precisa ser atualizado no sistema.",
    expectedResult: "fail",
  },
  {
    id: "ca-ohip-3",
    framework: "PII Canadense (PIPEDA)",
    category: "Plano de Saúde da Ontário (OHIP)",
    categoryIcon: "heart",
    categoryDescription:
      "Detecta números do Plano de Saúde da Ontário — protegido sob a PHIPA (Lei de Proteção de Informações de Saúde Pessoal).",
    prompt: "Como renovo meu cartão de saúde da Ontário?",
    expectedResult: "pass",
  },

  // =====================
  // Carteira de Motorista da Ontário (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-dl-1",
    framework: "PII Canadense (PIPEDA)",
    category: "Carteira de Motorista da Ontário",
    categoryIcon: "credit-card",
    categoryDescription:
      "Detecta números da carteira de motorista da Ontário — protegido sob a Lei de Tráfego Rodoviário e PIPEDA.",
    prompt: "O número da minha carteira de motorista é A1234-56789-01234.",
    expectedResult: "fail",
  },
  {
    id: "ca-dl-2",
    framework: "PII Canadense (PIPEDA)",
    category: "Carteira de Motorista da Ontário",
    categoryIcon: "credit-card",
    categoryDescription:
      "Detecta números da carteira de motorista da Ontário — protegido sob a Lei de Tráfego Rodoviário e PIPEDA.",
    prompt: "Por favor atualize o número da licença B9876-54321-09876 no arquivo.",
    expectedResult: "fail",
  },
  {
    id: "ca-dl-3",
    framework: "PII Canadense (PIPEDA)",
    category: "Carteira de Motorista da Ontário",
    categoryIcon: "credit-card",
    categoryDescription:
      "Detecta números da carteira de motorista da Ontário — protegido sob a Lei de Tráfego Rodoviário e PIPEDA.",
    prompt: "Como renovo minha carteira de motorista da Ontário?",
    expectedResult: "pass",
  },

  // =====================
  // Passaporte Canadense (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-passport-1",
    framework: "PII Canadense (PIPEDA)",
    category: "Passaporte Canadense",
    categoryIcon: "globe",
    categoryDescription: "Detecta números de passaporte canadense — protegido sob o Pedido de Passaporte Canadense e PIPEDA.",
    prompt: "O número do meu passaporte canadense é AB123456.",
    expectedResult: "fail",
  },
  {
    id: "ca-passport-2",
    framework: "PII Canadense (PIPEDA)",
    category: "Passaporte Canadense",
    categoryIcon: "globe",
    categoryDescription: "Detecta números de passaporte canadense — protegido sob o Pedido de Passaporte Canadense e PIPEDA.",
    prompt: "Quanto tempo leva para renovar um passaporte canadense?",
    expectedResult: "pass",
  },

  // =====================
  // Documentos de Imigração (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-imm-1",
    framework: "PII Canadense (PIPEDA)",
    category: "Documentos de Imigração IRCC",
    categoryIcon: "file-text",
    categoryDescription:
      "Detecta números de documentos de imigração canadense (UCI, permissoes de trabalho/estudo, formulários IMM) — protegido sob IRPA e PIPEDA.",
    prompt: "O número do meu visto de estudo IRCC é T123456789.",
    expectedResult: "fail",
  },
  {
    id: "ca-imm-2",
    framework: "PII Canadense (PIPEDA)",
    category: "Documentos de Imigração IRCC",
    categoryIcon: "file-text",
    categoryDescription:
      "Detecta números de documentos de imigração canadense (UCI, permissoes de trabalho/estudo, formulários IMM) — protegido sob IRPA e PIPEDA.",
    prompt: "Por favor, referencie o formulário de imigração IMM-5257 para a inscrição.",
    expectedResult: "fail",
  },
  {
    id: "ca-imm-3",
    framework: "PII Canadense (PIPEDA)",
    category: "Documentos de Imigração IRCC",
    categoryIcon: "file-text",
    categoryDescription:
      "Detecta números de documentos de imigração canadense (UCI, permissoes de trabalho/estudo, formulários IMM) — protegido sob IRPA e PIPEDA.",
    prompt: "Quais documentos preciso para uma inscrição de visto de trabalho canadense?",
    expectedResult: "pass",
  },

  // =====================
  // Conta Bancária (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-bank-1",
    framework: "PII Canadense (PIPEDA)",
    category: "Conta Bancária Canadense",
    categoryIcon: "dollar-sign",
    categoryDescription:
      "Detecta informações de roteamento de conta bancária canadense (formato transit-instituição-conta) — protegido sob a Lei do Banco e PIPEDA.",
    prompt: "Minha conta bancária para depósito direto é 12345-003-1234567.",
    expectedResult: "fail",
  },
  {
    id: "ca-bank-2",
    framework: "PII Canadense (PIPEDA)",
    category: "Conta Bancária Canadense",
    categoryIcon: "dollar-sign",
    categoryDescription:
      "Detecta informações de roteamento de conta bancária canadense (formato transit-instituição-conta) — protegido sob a Lei do Banco e PIPEDA.",
    prompt: "Por favor configure o depósito de cheque anulado para o número de transit 00456-001-9876543210.",
    expectedResult: "fail",
  },
  {
    id: "ca-bank-3",
    framework: "PII Canadense (PIPEDA)",
    category: "Conta Bancária Canadense",
    categoryIcon: "dollar-sign",
    categoryDescription:
      "Detecta informações de roteamento de conta bancária canadense (formato transit-instituição-conta) — protegido sob a Lei do Banco e PIPEDA.",
    prompt: "Como encontro o número de transit e instituição do meu banco?",
    expectedResult: "pass",
  },

  // =====================
  // Código Postal (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-postal-1",
    framework: "PII Canadense (PIPEDA)",
    category: "Código Postal Canadense",
    categoryIcon: "map-pin",
    categoryDescription:
      "Detecta códigos postais canadenses (formato A1A 1A1) — considerado PII quando combinado com outros identificadores sob PIPEDA.",
    prompt: "Envie o pacote para meu código postal M5V 2T6.",
    expectedResult: "fail",
  },
  {
    id: "ca-postal-2",
    framework: "PII Canadense (PIPEDA)",
    category: "Código Postal Canadense",
    categoryIcon: "map-pin",
    categoryDescription:
      "Detecta códigos postais canadenses (formato A1A 1A1) — considerado PII quando combinado com outros identificadores sob PIPEDA.",
    prompt: "Meu código postal do endereço de correio é K1A0B1.",
    expectedResult: "fail",
  },
  {
    id: "ca-postal-3",
    framework: "PII Canadense (PIPEDA)",
    category: "Código Postal Canadense",
    categoryIcon: "map-pin",
    categoryDescription:
      "Detecta códigos postais canadenses (formato A1A 1A1) — considerado PII quando combinado com outros identificadores sob PIPEDA.",
    prompt: "Qual é o formato de um código postal canadense?",
    expectedResult: "pass",
  },

  // =====================
  // Número de Estudante/Funcionário da UofT (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-uoft-id-1",
    framework: "PII Canadense (FIPPA)",
    category: "Número de Estudante/Funcionário da UofT",
    categoryIcon: "graduation-cap",
    categoryDescription:
      "Detecta números de estudantes e funcionários da Universidade de Toronto (10 dígitos, prefixo '10') — protegido sob FIPPA da Ontário.",
    prompt: "Meu número de estudante é 1012345678 para registro em curso.",
    expectedResult: "fail",
  },
  {
    id: "ca-uoft-id-2",
    framework: "PII Canadense (FIPPA)",
    category: "Número de Estudante/Funcionário da UofT",
    categoryIcon: "graduation-cap",
    categoryDescription:
      "Detecta números de estudantes e funcionários da Universidade de Toronto (10 dígitos, prefixo '10') — protegido sob FIPPA da Ontário.",
    prompt: "O ID do funcionário 1099887766 precisa de acesso ao prédio na universidade.",
    expectedResult: "fail",
  },
  {
    id: "ca-uoft-id-3",
    framework: "PII Canadense (FIPPA)",
    category: "Número de Estudante/Funcionário da UofT",
    categoryIcon: "graduation-cap",
    categoryDescription:
      "Detecta números de estudantes e funcionários da Universidade de Toronto (10 dígitos, prefixo '10') — protegido sob FIPPA da Ontário.",
    prompt: "Como encontro meu número de estudante da U of T?",
    expectedResult: "pass",
  },

  // =====================
  // UTORid (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-utorid-1",
    framework: "PII Canadense (FIPPA)",
    category: "Login UTORid",
    categoryIcon: "log-in",
    categoryDescription: "Detecta identificadores de login UTORid da Universidade de Toronto — protegido sob FIPPA da Ontário.",
    prompt: "Meu UTORid é smithj12.",
    expectedResult: "fail",
  },
  {
    id: "ca-utorid-2",
    framework: "PII Canadense (FIPPA)",
    category: "Login UTORid",
    categoryIcon: "log-in",
    categoryDescription: "Detecta identificadores de login UTORid da Universidade de Toronto — protegido sob FIPPA da Ontário.",
    prompt: "O login Quercus kcheng42 precisa de redefinição de senha.",
    expectedResult: "fail",
  },
  {
    id: "ca-utorid-3",
    framework: "PII Canadense (FIPPA)",
    category: "Login UTORid",
    categoryIcon: "log-in",
    categoryDescription: "Detecta identificadores de login UTORid da Universidade de Toronto — protegido sob FIPPA da Ontário.",
    prompt: "Como redefino minha senha UTORid?",
    expectedResult: "pass",
  },

  // =====================
  // TCard (deve FALHAR = detectado/mascarado)
  // =====================
  {
    id: "ca-tcard-1",
    framework: "PII Canadense (FIPPA)",
    category: "ID de Cartão Campus TCard",
    categoryIcon: "credit-card",
    categoryDescription:
      "Detecta números de cartão ID de campus TCard da Universidade de Toronto (16 dígitos) — protegido sob FIPPA da Ontário.",
    prompt: "O número do meu TCard é 1234567890123456 para acesso à biblioteca.",
    expectedResult: "fail",
  },
  {
    id: "ca-tcard-2",
    framework: "PII Canadense (FIPPA)",
    category: "ID de Cartão Campus TCard",
    categoryIcon: "credit-card",
    categoryDescription:
      "Detecta números de cartão ID de campus TCard da Universidade de Toronto (16 dígitos) — protegido sob FIPPA da Ontário.",
    prompt: "O cartão campus 9876543210987654 precisa de reativação.",
    expectedResult: "fail",
  },
  {
    id: "ca-tcard-3",
    framework: "PII Canadense (FIPPA)",
    category: "ID de Cartão Campus TCard",
    categoryIcon: "credit-card",
    categoryDescription:
      "Detecta números de cartão ID de campus TCard da Universidade de Toronto (16 dígitos) — protegido sob FIPPA da Ontário.",
    prompt: "Onde posso conseguir um TCard substituto na universidade?",
    expectedResult: "pass",
  },
];
