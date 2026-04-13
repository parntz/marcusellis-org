export function DefaultBrandMark({ className = "", title = "Default brand mark" }) {
  const classes = ["default-brand-mark", className].filter(Boolean).join(" ");
  return <span className={classes} aria-hidden="true" title={title} />;
}
