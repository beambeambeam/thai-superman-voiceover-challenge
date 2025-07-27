import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <p className="font-bold text-3xl">Thai Superman Voiceover Challenge</p>
      <Link href="/choice">
        <Button effect="shineHover">Start</Button>
      </Link>
    </div>
  );
}
