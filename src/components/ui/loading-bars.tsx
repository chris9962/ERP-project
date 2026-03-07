"use client";

type LoadingBarsProps = {
  message?: string;
};

export default function LoadingBars({ message = "Loading..." }: LoadingBarsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex h-8 items-end gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-loading-bar h-full w-1.5 origin-bottom rounded-sm bg-foreground"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="font-mono text-sm tracking-wider text-zinc-500 uppercase">{message}</span>
    </div>
  );
}
