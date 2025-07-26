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
} from "@/components/ui/media-player";
import Image from "next/image";

function ChoiceId() {
  const params = useParams<{ id: string }>();
  const choice = CHOICE.find((c) => c.id === params.id);

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

      <MediaPlayer className="h-20 w-full">
        <MediaPlayerAudio className="sr-only">
          <source src={choice.mp3} type="audio/mp3" />
        </MediaPlayerAudio>
        <MediaPlayerControls className="flex-col items-start gap-2.5">
          <MediaPlayerSeek withTime />
          <div className="flex w-full items-center justify-center gap-2">
            <MediaPlayerPlay />
            <MediaPlayerVolume />
          </div>
        </MediaPlayerControls>
      </MediaPlayer>
    </div>
  );
}
export default ChoiceId;
