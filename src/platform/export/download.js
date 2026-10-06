// Browser-only: hand a string or bytes to the visitor as a file download.
// Shared by every client-side export (CSV today; XLSX, ICS and PDF next).
export function downloadBlob(filename, data, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
