export function serviceLink(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  if (/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(
      "Service links must be same-origin paths or HTTP(S) URLs.",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.href.includes("?") ||
    url.href.includes("#") ||
    !/^\/[a-zA-Z0-9/_-]*$/.test(url.pathname)
  )
    throw new TypeError(
      "Service links must omit credentials, query and fragment.",
    );
  return url.href;
}
