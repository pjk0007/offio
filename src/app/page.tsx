import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Offio</h1>
        <p className="text-xl text-muted-foreground">
          재택근무 증빙 기반 근태관리 솔루션
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
