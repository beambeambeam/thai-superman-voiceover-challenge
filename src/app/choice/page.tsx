import { ChevronLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { CHOICE } from '@/app/choice/choice';
import { Button } from '@/components/ui/button';

function Choice() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <h1 className="font-bold text-3xl">Choose the challenge</h1>
      {CHOICE.map((c) => (
        <Link href={`/choice/${c.id}`} key={c.id}>
          <Button effect="shineHover">{c.label}</Button>
        </Link>
      ))}
      <Link href="/">
        <Button effect="ringHover" size="icon" variant="ghost">
          <ChevronLeftIcon />
        </Button>
      </Link>
    </div>
  );
}
export default Choice;
