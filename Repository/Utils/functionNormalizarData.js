export function normalizarDataParaFormatoBanco(data) {
  if (!data) return null;

  // Se já estiver no formato "yyyymmdd", retorna como está
  if (/^\d{8}$/.test(data)) {
    return data;
  }

  // Se estiver no formato "yyyy-mm-dd", converte
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data.replace(/-/g, '');
  }

  // Se for objeto Date (raro, mas pode acontecer)
  const dateObj = new Date(data);
  if (!isNaN(dateObj.getTime())) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  throw new Error(`Formato de data inválido: ${data}`);
}
