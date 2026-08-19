type BrandLogoProps = Readonly<{
  className?: string;
  priority?: boolean;
}>;

export function BrandLogo({ className = '', priority = false }: BrandLogoProps) {
  return (
    <img
      src="/brand/mon-etude-de-sol-logo.png"
      alt="Mon étude de sol.fr"
      width="1536"
      height="1024"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
    />
  );
}
