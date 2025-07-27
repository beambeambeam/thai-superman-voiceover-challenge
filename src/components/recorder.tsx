import { Mic2Icon, Trash } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useControllableState } from '../hooks/state';

interface RecorderProps {
  value?: File | null;
  defaultValue?: File | null;
  onChange?: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  timerClassName?: string;
  timeLimit?: number;
}

const padWithLeadingZeros = (num: number, length: number): string => {
  return String(num).padStart(length, '0');
};

const Recorder: React.FC<RecorderProps> = ({
  value,
  defaultValue = null,
  onChange,
  disabled = false,
  className,
  timerClassName,
  timeLimit,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const chunks = useRef<Blob[]>([]);
  const timerTimeout = useRef<NodeJS.Timeout | null>(null);

  const [file, setFile] = useControllableState<File | null>({
    prop: value,
    defaultProp: defaultValue,
    onChange,
  });

  const hours = Math.floor(timer / 3600);
  const minutes = Math.floor((timer % 3600) / 60);
  const seconds = timer % 60;
  const [hourLeft, hourRight] = useMemo(
    () => padWithLeadingZeros(hours, 2).split(''),
    [hours]
  );
  const [minuteLeft, minuteRight] = useMemo(
    () => padWithLeadingZeros(minutes, 2).split(''),
    [minutes]
  );
  const [secondLeft, secondRight] = useMemo(
    () => padWithLeadingZeros(seconds, 2).split(''),
    [seconds]
  );

  const mediaRecorderRef = useRef<{
    stream: MediaStream | null;
    analyser: AnalyserNode | null;
    audioContext: AudioContext | null;
  }>({
    stream: null,
    analyser: null,
    audioContext: null,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<any>(null);

  const handleReset = useCallback(() => {
    setFile(null);
    setAudioUrl(null);
    setIsRecording(false);
    setTimer(0);
    if (timerTimeout.current) clearTimeout(timerTimeout.current);
    // Stop audio context and stream
    const { stream, analyser, audioContext } = mediaRecorderRef.current;
    if (analyser) analyser.disconnect();
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (audioContext) audioContext.close();
    cancelAnimationFrame(animationRef.current || 0);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [setFile]);

  const handleStop = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerTimeout.current) clearTimeout(timerTimeout.current);
    }
  }, [mediaRecorder, isRecording]);

  const handleStart = useCallback(async () => {
    handleReset();
    if (disabled || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new window.AudioContext();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      mediaRecorderRef.current = { stream, analyser, audioContext: audioCtx };
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      setMediaRecorder(recorder);
      chunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setFile(file);
        setAudioUrl(URL.createObjectURL(blob));
      };
      recorder.start();
      setIsRecording(true);
      setTimer(0);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  }, [disabled, isRecording, setFile, handleReset]);

  useEffect(() => {
    if (isRecording) {
      if (timeLimit && timer >= timeLimit / 1000) {
        handleStop();
        return;
      }
      timerTimeout.current = setTimeout(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerTimeout.current) clearTimeout(timerTimeout.current);
    };
  }, [isRecording, timer, timeLimit, handleStop]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const drawWaveform = (dataArray: Uint8Array) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#939393';
      const barWidth = 1;
      const spacing = 1;
      const maxBarHeight = HEIGHT / 2.5;
      const numBars = Math.floor(WIDTH / (barWidth + spacing));
      for (let i = 0; i < numBars; i++) {
        const barHeight = (dataArray[i] / 128.0) ** 8 * maxBarHeight;
        const x = (barWidth + spacing) * i;
        const y = HEIGHT / 2 - barHeight / 2;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };
    const visualizeVolume = () => {
      if (!mediaRecorderRef.current?.stream) return;
      const sampleRate = 1024;
      const dataArray = new Uint8Array(sampleRate);
      const draw = () => {
        if (!isRecording) {
          cancelAnimationFrame(animationRef.current || 0);
          return;
        }
        animationRef.current = requestAnimationFrame(draw);
        mediaRecorderRef.current?.analyser?.getByteTimeDomainData(dataArray);
        drawWaveform(dataArray);
      };
      draw();
    };
    if (isRecording) {
      visualizeVolume();
    } else {
      if (ctx) ctx.clearRect(0, 0, WIDTH, HEIGHT);
      cancelAnimationFrame(animationRef.current || 0);
    }
    return () => {
      cancelAnimationFrame(animationRef.current || 0);
    };
  }, [isRecording]);

  return (
    <div
      className={cn(
        'relative flex h-16 w-full items-center justify-center gap-2 rounded-md',
        { 'border p-1': isRecording, 'border-none p-0': !isRecording },
        className
      )}
    >
      {isRecording ? (
        <Timer
          hourLeft={hourLeft}
          hourRight={hourRight}
          minuteLeft={minuteLeft}
          minuteRight={minuteRight}
          secondLeft={secondLeft}
          secondRight={secondRight}
          timerClassName={timerClassName}
        />
      ) : null}

      <canvas
        className={`h-full w-full bg-background ${
          isRecording ? 'flex' : 'hidden'
        }`}
        ref={canvasRef}
      />

      <div className="flex items-center justify-center gap-2">
        {!isRecording && (
          <Button
            disabled={disabled}
            onClick={isRecording ? handleStop : handleStart}
            size="icon"
            variant={isRecording ? 'ghost' : 'outline'}
          >
            <Mic2Icon />
          </Button>
        )}
      </div>

      {file && audioUrl && (
        <div className="flex w-fit justify-center">
          <audio controls src={audioUrl}>
            <track kind="captions" label="English captions" srcLang="en" />
          </audio>
        </div>
      )}
    </div>
  );
};

const Timer = React.memo(
  ({
    hourLeft,
    hourRight,
    minuteLeft,
    minuteRight,
    secondLeft,
    secondRight,
    timerClassName,
  }: {
    hourLeft: string;
    hourRight: string;
    minuteLeft: string;
    minuteRight: string;
    secondLeft: string;
    secondRight: string;
    timerClassName?: string;
  }) => {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-0.5 rounded-md border p-1.5 font-medium font-mono text-foreground',
          timerClassName
        )}
      >
        <span className="rounded-md bg-background p-0.5 text-foreground">
          {hourLeft}
        </span>
        <span className="rounded-md bg-background p-0.5 text-foreground">
          {hourRight}
        </span>
        <span>:</span>
        <span className="rounded-md bg-background p-0.5 text-foreground">
          {minuteLeft}
        </span>
        <span className="rounded-md bg-background p-0.5 text-foreground">
          {minuteRight}
        </span>
        <span>:</span>
        <span className="rounded-md bg-background p-0.5 text-foreground">
          {secondLeft}
        </span>
        <span className="rounded-md bg-background p-0.5 text-foreground ">
          {secondRight}
        </span>
      </div>
    );
  }
);
Timer.displayName = 'Timer';

export default Recorder;
