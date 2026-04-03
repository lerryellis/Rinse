import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // For now, default to English. In the future, detect from cookies/headers.
  const locale = "en";
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
