import { CHOICE } from "@/app/choice/choice";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function Choice() {
  return (
    <div className="flex items-center justify-center w-full h-full flex-col gap-2">
      <h1 className="text-3xl font-bold">Choose the challenge</h1>
      {CHOICE.map((c) => (
        <Link href={`/choice/${c.id}`} key={c.id}>
          <Button>{c.label}</Button>
        </Link>
      ))}
    </div>
  );
}
export default Choice;
