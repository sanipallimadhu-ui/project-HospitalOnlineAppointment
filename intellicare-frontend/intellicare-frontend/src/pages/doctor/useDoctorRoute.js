import { useCallback, useEffect, useState } from "react";

export const DOCTOR_ROUTES = ["home", "queue", "today", "upcoming", "records", "schedule", "notifs"];

const read = () => {
  const m = window.location.hash.match(/^#\/doctor\/([\w-]+)/);
  return m && DOCTOR_ROUTES.includes(m[1]) ? m[1] : "home";
};

/** Tiny hash router: each sidebar item gets its own URL (#/doctor/queue) so
 *  it renders its own page, and the browser back/forward buttons work. */
export default function useDoctorRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((key) => { window.location.hash = `#/doctor/${key}`; }, []);
  return [route, go];
}
