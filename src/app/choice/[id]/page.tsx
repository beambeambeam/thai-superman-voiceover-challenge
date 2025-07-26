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

function ChoiceId() {
  const params = useParams<{ id: string }>();
  const choice = CHOICE.find((c) => c.id === params.id);

  const [replayCount, setReplayCount] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    </div>
  );
}
export default ChoiceId;
