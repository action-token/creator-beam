import { Card, CardContent, CardHeader } from "~/components/shadcn/ui/card";

export default function BountySkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-[0.95rem] border border-[#ddd9d0] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)] dark:border-zinc-700 dark:bg-zinc-900">
      <CardHeader className="relative p-0">
        <div className="h-52 w-full animate-pulse rounded-t-[0.95rem] bg-[#d8c7bb] dark:bg-zinc-800" />
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="mb-3 flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded bg-[#f3f1ee] dark:bg-zinc-800" />
          <div className="h-6 w-16 animate-pulse rounded bg-[#f3f1ee] dark:bg-zinc-800" />
        </div>
        <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-[#f3f1ee] dark:bg-zinc-800" />
        <div className="mb-2 h-4 w-full animate-pulse rounded bg-[#f3f1ee] dark:bg-zinc-800" />
        <div className="mb-2 h-4 w-full animate-pulse rounded bg-[#f3f1ee] dark:bg-zinc-800" />
        <div className="mb-4 h-4 w-2/3 animate-pulse rounded bg-[#f3f1ee] dark:bg-zinc-800" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[#f3f1ee] dark:bg-zinc-800" />
      </CardContent>
    </Card>
  );
}
