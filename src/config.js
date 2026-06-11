export const config = {
  adzuna: {
    appId: process.env.ADZUNA_APP_ID || "",
    appKey: process.env.ADZUNA_APP_KEY || ""
  },
  jsearch: {
    apiKey: process.env.JSEARCH_API_KEY || ""
  },
  tavily: {
    apiKey: process.env.TAVILY_API_KEY || ""
  }
};

export function sourceStatus() {
  return {
    adzuna: Boolean(config.adzuna.appId && config.adzuna.appKey),
    jsearch: Boolean(config.jsearch.apiKey),
    tavily: Boolean(config.tavily.apiKey)
  };
}
