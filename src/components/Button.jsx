// Native button semantics with the site's existing shared button styles.
export default function Button({ variant = "primary", className = "", type = "button", ...props }) {
  const classes = [...new Set(["btn", ...(variant === "secondary" ? ["btn-ghost"] : []), ...className.split(/\s+/).filter(Boolean)])].join(" ");
  return <button {...props} type={type} className={classes} />;
}
