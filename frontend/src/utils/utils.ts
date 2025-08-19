export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

export async function copyToClipboard(data: ClipboardItem): Promise<void> {
  try {
    await navigator.clipboard.write([data]);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
  }
}
