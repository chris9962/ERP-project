import LoadingBars from "@/components/ui/loading-bars";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingBars message="Loading..." />
    </div>
  );
}
