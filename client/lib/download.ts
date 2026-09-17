/** Hands a fetched file to the browser as a download. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick: some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
