export function formatBs(value: number, decimales = 0): string {
  return `Bs. ${value.toLocaleString('es-BO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}`;
}

export function formatNumero(value: number, decimales = 0): string {
  return value.toLocaleString('es-BO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}
