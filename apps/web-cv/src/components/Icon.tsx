import { iconFor } from '@/lib/icons';

export const Icon = ({
  name,
  size = 20,
  className,
}: {
  name: string | undefined;
  size?: number;
  className?: string;
}) => {
  const Component = iconFor(name);

  if (!Component) {
    return null;
  }

  return <Component size={size} strokeWidth={1.75} className={className} aria-hidden="true" />;
};
