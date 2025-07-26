import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full h-full flex items-center justify-center flex-col gap-2">
      <p className="text-3xl font-bold">Thai Superman Voiceover Challenge</p>
      <Link href="/choice">
        <Button>Start</Button>
      </Link>
    </div>
  );
}
