import React from 'react';
import { Download } from 'lucide-react';

const ExportButton = ({ data, filename, label = 'Exportar' }) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    // Obter cabeçalhos das colunas
    const headers = Object.keys(data[0]);
    
    // Criar CSV
    const csvContent = [
      // Cabeçalhos
      headers.join(','),
      // Dados
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar vírgulas e aspas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToCSV}
      className="btn btn-secondary flex items-center gap-2"
      disabled={!data || data.length === 0}
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
};

export default ExportButton;
