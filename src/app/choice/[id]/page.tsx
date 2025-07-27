'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import confetti from 'canvas-confetti';
import { ChevronLeftIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type React from 'react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { useServerAction } from 'zsa-react';
import { calculateVoiceSim } from '@/app/choice/[id]/action';
import { CHOICE } from '@/app/choice/choice';
import { NumberTicker } from '@/components/magicui/number-ticker';
import Recorder from '@/components/recorder';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  MediaPlayer,
  MediaPlayerAudio,
  MediaPlayerControls,
  MediaPlayerPlay,
  MediaPlayerSeek,
  MediaPlayerVolume,
} from '@/components/ui/media-player';

const formSchema = z.object({
  audio: z.instanceof(File),
});

function ChoiceId() {
  const params = useParams<{ id: string }>();
  const choice = CHOICE.find((c) => c.id === params.id);

  const [replayCount, setReplayCount] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { isPending, execute, data } = useServerAction(calculateVoiceSim, {
    onSuccess: () => {
      // Fire confetti fireworks
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.5, 0.8), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.2 },
        });
      }, 250);
    },
  });

  const handleEnded = () => {
    setReplayCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        setIsDisabled(true);
      }
      return next;
    });
  };

  const handlePlay = (e: React.SyntheticEvent) => {
    if (isDisabled) {
      e.preventDefault();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  if (!choice) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-2">
        <span className="text-4xl text-destructive">Not found</span>
        <Link href="/choice">
          <Button>Go back</Button>
        </Link>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append('audio', values.audio);
    formData.append('id', params.id);

    await execute(formData);
  }

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center gap-2">
      {isPending && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center border border-border/40 border-solid bg-background/20 backdrop-blur-sm"
          style={{
            borderRadius: 'inherit',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.08)',
            borderImage: 'inherit',
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="font-bold text-foreground text-lg">
              Hang tight, magic is happening ✨
            </span>
          </div>
        </div>
      )}

      {data && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center border border-border/40 border-solid bg-background/20 backdrop-blur-xs"
          style={{
            borderRadius: 'inherit',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.08)',
            borderImage: 'inherit',
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="font-bold text-background text-lg">
              You got{' '}
              <NumberTicker
                className="whitespace-pre-wrap font-medium text-8xl text-white tracking-tighter"
                value={data.score}
              />
            </span>
            <Link href="/choice">
              <Button effect="shineHover" variant="default">
                Checkout others challenge
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="flex w-full max-w-[700px] items-center justify-center gap-2">
        <Link href="/choice">
          <Button effect="ringHover" size="icon" variant="ghost">
            <ChevronLeftIcon />
          </Button>
        </Link>
        <h1 className="font-bold text-3xl">{choice.label}</h1>
      </div>

      <div className="relative aspect-video w-[90vw] max-w-[700px]">
        <Image
          alt={choice.label}
          className="h-auto w-auto"
          fill
          priority
          quality={100}
          sizes="(max-width: 900px) 99vw, 700px"
          src={choice.image}
          style={{ objectFit: 'contain' }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        {replayCount}/3{' '}
        {isDisabled && (
          <div className="text-destructive">
            You have reached the maximum number of replays.
          </div>
        )}
      </div>

      <div className="border-foreground border-l-4 bg-accent p-4 font-bold text-2xl italic">
        {choice.lyrics}
      </div>

      <MediaPlayer
        className="h-15 w-[700px] max-w-screen"
        onEnded={handleEnded}
      >
        <MediaPlayerAudio
          className="sr-only"
          onPlay={handlePlay}
          ref={audioRef}
        >
          <source src={choice.mp3} type="audio/mp3" />
        </MediaPlayerAudio>
        <MediaPlayerControls className="flex-col items-start gap-2.5">
          <div className="flex w-full items-center justify-center gap-2">
            <MediaPlayerPlay />
            <MediaPlayerSeek withTime />
            <p className="text-foreground">{choice.time}ms</p>
            <MediaPlayerVolume />
          </div>
        </MediaPlayerControls>
      </MediaPlayer>

      <Form {...form}>
        <form
          className="flex flex-col items-center justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(onSubmit)(e);
          }}
        >
          <FormField
            control={form.control}
            name="audio"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Recorder
                    {...field}
                    className="w-[70vw]"
                    timeLimit={choice.time}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button disabled={!form.formState.isValid} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
}
export default ChoiceId;
