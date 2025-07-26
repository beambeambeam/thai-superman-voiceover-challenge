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

      <MediaPlayer className="h-20 w-full">
        <MediaPlayerAudio className="sr-only">
          <source
            src="https://1i39q4zekz.ufs.sh/f/zi7vM2Za6Ydh6oE7gSWT0A2GFRb3mNUqzJen5XHlxi7vLuhC"
            type="audio/mp3"
          />
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
