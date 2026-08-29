export default function Icon({
  name,
  fill = false,
  className = "",
}: {
  name: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <span className={`material-symbols-outlined ${fill ? "fill" : ""} ${className}`}>
      {name}
    </span>
  );
}
