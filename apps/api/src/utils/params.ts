// Safely extract a single string from req.params / req.query which can be string | string[]
export function paramStr(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}
