export default function Avatar({ name, urgent }) {
  const initials = name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <span className={`av ${urgent ? "u" : ""}`}>{initials}</span>;
}
