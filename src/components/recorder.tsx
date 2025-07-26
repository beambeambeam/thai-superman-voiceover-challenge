import React, { useRef, useState, useCallback } from "react";
import { useControllableState } from "../hooks/state";
import { Button } from "@/components/ui/button";
import { Mic2Icon } from "lucide-react";

interface RecorderProps {
  value?: File | null;
  defaultValue?: File | null;
  onChange?: (file: File | null) => void;
  disabled?: boolean;
}

export const Recorder: React.FC<RecorderProps> = ({
  value,
  defaultValue = null,
  onChange,
  disabled = false,
}) => {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const chunks = useRef<Blob[]>([]);

  const [file, setFile] = useControllableState<File | null>({
    prop: value,
    defaultProp: defaultValue,
    onChange,
  });

  const handleReset = () => {
    setFile(null);
    setAudioUrl(null);
  };

  const handleStart = useCallback(async () => {
    handleReset();

    if (disabled || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      setMediaRecorder(recorder);
      chunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        setFile(file);
        setAudioUrl(URL.createObjectURL(blob));
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  }, [disabled, recording, setFile]);

  const handleStop = useCallback(() => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  }, [mediaRecorder, recording]);

  return (
    <div className="flex flex-col gap-2 items-center">
      <Button
        type="button"
        size="icon"
        onClick={async () => {
          recording ? handleStop() : handleStart();
        }}
        disabled={disabled}
        variant={recording ? "ghost" : "outline"}
      >
        <Mic2Icon />
      </Button>
      {file && (
        <div>
          <audio controls src={audioUrl || undefined} />
        </div>
      )}
    </div>
  );
};

export default Recorder;
