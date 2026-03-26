export default function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const variants = {
    default: "bg-gray-800 text-gray-300",
    success: "bg-green-500/10 text-green-400",
    warning: "bg-yellow-500/10 text-yellow-400",
    error: "bg-red-500/10 text-red-400",
    info: "bg-blue-500/10 text-blue-400",
  };
  return <span className={`${base} ${variants[variant]}`}>{children}</span>;
}
