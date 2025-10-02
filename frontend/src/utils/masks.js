// Utilitários para aplicar máscaras de entrada

export const maskCNPJ = (value) => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numericValue = value.replace(/\D/g, '');
  
  // Aplica a máscara 00.000.000/0000-00
  if (numericValue.length <= 2) {
    return numericValue;
  } else if (numericValue.length <= 5) {
    return `${numericValue.slice(0, 2)}.${numericValue.slice(2)}`;
  } else if (numericValue.length <= 8) {
    return `${numericValue.slice(0, 2)}.${numericValue.slice(2, 5)}.${numericValue.slice(5)}`;
  } else if (numericValue.length <= 12) {
    return `${numericValue.slice(0, 2)}.${numericValue.slice(2, 5)}.${numericValue.slice(5, 8)}/${numericValue.slice(8)}`;
  } else {
    return `${numericValue.slice(0, 2)}.${numericValue.slice(2, 5)}.${numericValue.slice(5, 8)}/${numericValue.slice(8, 12)}-${numericValue.slice(12, 14)}`;
  }
};

export const maskTelefone = (value) => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numericValue = value.replace(/\D/g, '');
  
  // Aplica a máscara (00) 00000-0000 ou (00) 0000-0000
  if (numericValue.length <= 2) {
    return numericValue;
  } else if (numericValue.length <= 3) {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
  } else if (numericValue.length <= 7) {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 3)}${numericValue.slice(3)}`;
  } else if (numericValue.length <= 10) {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 6)}-${numericValue.slice(6)}`;
  } else {
    return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`;
  }
};

export const maskCEP = (value) => {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numericValue = value.replace(/\D/g, '');
  
  // Aplica a máscara 00000-000
  if (numericValue.length <= 5) {
    return numericValue;
  } else {
    return `${numericValue.slice(0, 5)}-${numericValue.slice(5, 8)}`;
  }
};

// Função para remover máscara (para enviar ao backend)
export const removeMask = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

// Validações
export const validateCNPJ = (cnpj) => {
  const numericCNPJ = removeMask(cnpj);
  
  if (numericCNPJ.length !== 14) {
    return false;
  }
  
  // Validação básica de CNPJ (algoritmo simplificado)
  // Em produção, recomenda-se usar uma biblioteca específica para validação de CNPJ
  if (/^(\d)\1+$/.test(numericCNPJ)) {
    return false; // Todos os dígitos iguais
  }
  
  return true;
};

export const validateTelefone = (telefone) => {
  const numericTelefone = removeMask(telefone);
  return numericTelefone.length >= 10 && numericTelefone.length <= 11;
};

export const validateCEP = (cep) => {
  const numericCEP = removeMask(cep);
  return numericCEP.length === 8;
};
