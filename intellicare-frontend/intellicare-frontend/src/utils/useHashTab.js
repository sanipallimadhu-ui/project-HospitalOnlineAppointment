import { useCallback, useEffect, useState } from "react";

// URL prefix per role, e.g. #/reception/queue
export const ROLE_PREFIX = { doctor: "doctor", receptionist: "reception", admin: "admin", patient: "patient" };
const HOME_TABS = ["home", "overview"];

const tabOf = (prefix) => {
  const m = window.location.hash.match(new RegExp(`^#/${prefix}/([\\w-]+)`));
  return m ? m[1] : null;
};

/** Each sidebar item gets its own URL (#/<prefix>/<tab>) so it opens as its own page. */
export function useHashTab(prefix, valid, def) {
  const read = () => { const t = tabOf(prefix); return t && valid.includes(t) ? t : def; };
  const [tab, setTab] = useState(read);
  useEffect(() => {
    const on = () => { setTab(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const go = useCallback((key) => { window.location.hash = `#/${prefix}/${key}`; }, [prefix]);
  return [tab, go];
}

/** True when the current page is the role's home/overview page (used to show the welcome banner only there). */
export function useIsHomePage(role) {
  const [, force] = useState(0);
  useEffect(() => {
    const on = () => force((n) => n + 1);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const t = tabOf(ROLE_PREFIX[role] || role);
  return !t || HOME_TABS.includes(t);
}
