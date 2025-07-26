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

  const { isPending, execute, data, error } =
    useServerAction(calculateVoiceSim);

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
    await execute(formData);
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center flex-col">
      {choice.label}

      <div className="w-[70vw] relative aspect-video">
        <Image
          src={choice.image}
          alt={choice.label}
          fill
          style={{ objectFit: "contain" }}
          className="h-auto w-auto"
          quality={100}
          sizes="(max-width: 1200px) 70vw, 800px"
          priority
        />
      </div>

      <div className="flex flex-col gap-2 items-center justify-center">
        <p>{replayCount}/3</p>
        {isDisabled && (
          <div className="text-red-500 mt-2">
            You have reached the maximum number of replays.
          </div>
        )}
      </div>

      <MediaPlayer className="h-15 w-full" onEnded={handleEnded}>
        <MediaPlayerAudio
          className="sr-only"
          ref={audioRef}
          onPlay={handlePlay}
        >
          <source src={choice.mp3} type="audio/mp3" />
        </MediaPlayerAudio>
        <MediaPlayerControls className="flex-col items-start gap-2.5">
          <div className="flex w-full items-center justify-center gap-2">
            <MediaPlayerPlay disabled={isDisabled} />
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
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="audio"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="file"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      field.onChange(file);
                    }}
                  />
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
