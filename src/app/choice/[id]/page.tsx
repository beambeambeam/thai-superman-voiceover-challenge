"use client";

import { CHOICE } from "@/app/choice/choice";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MediaPlayer,
  MediaPlayerAudio,
  MediaPlayerControls,
  MediaPlayerPlay,
  MediaPlayerSeek,
  MediaPlayerVolume,
} from "@/components/ui/media-player";
import Image from "next/image";

import React, { useState, useRef } from "react";
import z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { useServerAction } from "zsa-react";
import { calculateVoiceSim } from "@/app/choice/[id]/action";
import Recorder from "@/components/recorder";
import { ChevronLeft, ChevronLeftIcon } from "lucide-react";

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

  const { execute } = useServerAction(calculateVoiceSim);

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
      <div className="h-screen w-screen flex items-center justify-center flex-col gap-2">
        <span className="text-destructive text-4xl">Not found</span>
        <Link href="/choice">
          <Button>Go back</Button>
        </Link>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("audio", values.audio);
    formData.append("id", params.id);

    await execute(formData);
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center flex-col gap-2">
      <div className="grid grid-cols-[auto_1fr_auto] w-full max-w-[700px]">
        <Link href="/choice">
          <Button size="icon" effect="shineHover">
            <ChevronLeftIcon />
          </Button>
        </Link>
        <h1 className="w-full text-center text-3xl font-bold">
          {choice.label}
        </h1>
      </div>

      <div className="w-[90vw] max-w-[700px] relative aspect-video">
        <Image
          src={choice.image}
          alt={choice.label}
          fill
          style={{ objectFit: "contain" }}
          className="h-auto w-auto"
          quality={100}
          sizes="(max-width: 900px) 99vw, 700px"
          priority
        />
      </div>

      <div className="flex gap-2 items-center justify-center">
        {replayCount}/3{" "}
        {isDisabled && (
          <div className="text-destructive">
            You have reached the maximum number of replays.
          </div>
        )}
      </div>

      <MediaPlayer className="h-15 w-[700px]" onEnded={handleEnded}>
        <MediaPlayerAudio
          className="sr-only"
          ref={audioRef}
          onPlay={handlePlay}
        >
          <source src={choice.mp3} type="audio/mp3" />
        </MediaPlayerAudio>
        <MediaPlayerControls className="flex-col items-start gap-2.5">
          <div className="flex w-full items-center justify-center gap-2">
            <MediaPlayerPlay />
            <MediaPlayerSeek withTime />
            <MediaPlayerVolume />
          </div>
        </MediaPlayerControls>
      </MediaPlayer>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(onSubmit)(e);
          }}
          className="flex flex-col items-center justify-center"
        >
          <FormField
            control={form.control}
            name="audio"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Recorder {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}
export default ChoiceId;
