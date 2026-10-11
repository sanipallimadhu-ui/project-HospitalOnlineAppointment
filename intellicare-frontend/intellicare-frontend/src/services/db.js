// Storage layer. Swap these two functions for REST calls to Spring Boot.
const KEY = "intellicare:v1";

export const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
};
export const save = (data) => {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
};
