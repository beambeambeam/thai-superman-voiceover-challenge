"use client";

import { CHOICE } from "@/app/choice/choice";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MediaPlayer,
  MediaPlayerAudio,
  MediaPlayerControls,
  MediaPlayerLoop,
  MediaPlayerPlay,
  MediaPlayerPlaybackSpeed,
  MediaPlayerSeek,
  MediaPlayerSeekBackward,
  MediaPlayerSeekForward,
  MediaPlayerVolume,
  MediaPlayerTime, // <-- add this import
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

      <Image
        src={choice.image}
        alt={choice.label}
        width={0}
        height={0}
        className="h-auto w-auto max-w-xs max-h-64"
      />

      <div>{replayCount}/3</div>

      <MediaPlayer className="h-20 w-full" onEnded={handleEnded}>
        <MediaPlayerAudio
          className="sr-only"
          ref={audioRef}
          onPlay={handlePlay}
        >
          <source src={choice.mp3} type="audio/mp3" />
        </MediaPlayerAudio>
        <MediaPlayerControls className="flex-col items-start gap-2.5">
          <MediaPlayerSeek withTime />
          <div className="flex w-full items-center justify-center gap-2">
            <MediaPlayerPlay disabled={isDisabled} />
            <MediaPlayerVolume />
          </div>
        </MediaPlayerControls>
      </MediaPlayer>
      {isDisabled && (
        <div className="text-red-500 mt-2">
          You have reached the maximum number of replays.
        </div>
      )}
    </div>
  );
}
export default ChoiceId;
