// Decorative falling snow. Positions are derived from the index so server and
// client render identically.
export function Snowfall({ count = 24 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37) % 100;
        const size = 4 + ((i * 7) % 6);
        const duration = 14 + ((i * 11) % 16);
        const delay = -((i * 13) % 30);
        const drift = ((i % 5) - 2) * 12;
        return (
          <span
            key={i}
            className="snowflake"
            style={
              {
                left: `${left}%`,
                width: size,
                height: size,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                "--drift": `${drift}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
