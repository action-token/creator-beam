// export const BASE_URL = "https://app.action-tokens.com/";
// export const BASE_URL = "http://localhost:3000";
export const BASE_URL = process.env.NODE_ENV === "production" ? "https://app.beam-us.com/" : "http://localhost:3000";
