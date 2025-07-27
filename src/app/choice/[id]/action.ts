'use server';

import z from 'zod';
import { createServerAction } from 'zsa';
import { CHOICE } from '@/app/choice/choice';

declare global {
  var webkitAudioContext: typeof AudioContext | undefined;
}

const getAudioContext = (): AudioContext => {
  const AudioContextClass =
    (globalThis.AudioContext as typeof AudioContext | undefined) ||
    (globalThis.webkitAudioContext as typeof AudioContext | undefined);
  if (!AudioContextClass) {
    throw new Error('AudioContext is not supported in this environment');
  }
  return new AudioContextClass();
};

export const calculateVoiceSim = createServerAction()
  .input(
    z.object({
      id: z.string(),
      audio: z.instanceof(File),
    }),
    {
      type: 'formData',
    }
  )
  .output(
    z.object({
      score: z.number(),
    })
  )
  .handler(async ({ input }) => {
    const choice = CHOICE.find((c) => c.id === input.id);
    if (!choice) {
      throw new Error('Choice not found');
    }

    const score = await calculateAcousticSimilarity(input.audio, choice.mp3);

    return {
      score: Math.round(score * 10) / 10,
    };
  });

async function calculateAcousticSimilarity(
  uploadedAudio: File,
  referenceUrl?: string
): Promise<number> {
  if (!referenceUrl) {
    return 50; // neutral score if no reference
  }

  try {
    const audioContext = getAudioContext();

    // Process uploaded audio
    const uploadedBuffer = await uploadedAudio.arrayBuffer();
    const uploadedAudioBuffer = await audioContext.decodeAudioData(
      uploadedBuffer.slice(0)
    );

    // Process reference audio
    const refResponse = await fetch(referenceUrl);
    const refBuffer = await refResponse.arrayBuffer();
    const refAudioBuffer = await audioContext.decodeAudioData(
      refBuffer.slice(0)
    );

    // Extract features from both audio files
    const uploadedFeatures = await extractAudioFeatures(
      uploadedAudioBuffer,
      audioContext
    );
    const refFeatures = await extractAudioFeatures(
      refAudioBuffer,
      audioContext
    );

    // Calculate similarity scores for different acoustic features
    const durationSimilarity = calculateDurationSimilarity(
      uploadedFeatures.duration,
      refFeatures.duration
    );
    const energySimilarity = calculateEnergySimilarity(
      uploadedFeatures.energy,
      refFeatures.energy
    );
    const spectralSimilarity = calculateSpectralSimilarity(
      uploadedFeatures.spectralCentroid,
      refFeatures.spectralCentroid
    );
    const pitchSimilarity = calculatePitchSimilarity(
      uploadedFeatures.fundamentalFreq,
      refFeatures.fundamentalFreq
    );
    const rhythmSimilarity = calculateRhythmSimilarity(
      uploadedFeatures.zeroCrossings,
      refFeatures.zeroCrossings
    );

    // Weighted combination of acoustic features
    const acousticScore =
      durationSimilarity * 0.25 +
      energySimilarity * 0.2 +
      spectralSimilarity * 0.25 +
      pitchSimilarity * 0.2 +
      rhythmSimilarity * 0.1;

    await audioContext.close();
    return Math.max(0, Math.min(100, acousticScore));
  } catch {
    return 50;
  }
}

function extractAudioFeatures(
  audioBuffer: AudioBuffer,
  audioContext: AudioContext
) {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // Energy/Volume analysis
  const energy = calculateRMSEnergy(channelData);

  // Spectral analysis using FFT
  const fftSize = 2048;
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;

  // Calculate spectral centroid (brightness)
  const spectralCentroid = calculateSpectralCentroid(
    channelData,
    sampleRate,
    fftSize
  );

  // Fundamental frequency estimation (pitch)
  const fundamentalFreq = estimateFundamentalFrequency(channelData, sampleRate);

  // Zero crossing rate (roughness/texture)
  const zeroCrossings = calculateZeroCrossingRate(channelData);

  return {
    duration,
    energy,
    spectralCentroid,
    fundamentalFreq,
    zeroCrossings,
  };
}

function calculateRMSEnergy(channelData: Float32Array): number {
  let sum = 0;
  for (const sample of channelData) {
    sum += sample * sample;
  }
  return Math.sqrt(sum / channelData.length);
}

function calculateSpectralCentroid(
  channelData: Float32Array,
  sampleRate: number,
  fftSize: number
): number {
  // Simple spectral centroid calculation
  const windowSize = Math.min(fftSize, channelData.length);
  const window = channelData.slice(0, windowSize);

  // Apply Hanning window
  for (let i = 0; i < windowSize; i++) {
    window[i] *= 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
  }

  // Simple DFT for spectral analysis
  const spectrum = new Array(windowSize / 2);
  for (let k = 0; k < windowSize / 2; k++) {
    let real = 0,
      imag = 0;
    for (let n = 0; n < windowSize; n++) {
      const angle = (-2 * Math.PI * k * n) / windowSize;
      real += window[n] * Math.cos(angle);
      imag += window[n] * Math.sin(angle);
    }
    spectrum[k] = Math.sqrt(real * real + imag * imag);
  }

  // Calculate centroid
  let weightedSum = 0,
    magnitudeSum = 0;
  for (let i = 0; i < spectrum.length; i++) {
    const frequency = (i * sampleRate) / (2 * spectrum.length);
    weightedSum += frequency * spectrum[i];
    magnitudeSum += spectrum[i];
  }

  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
}

function estimateFundamentalFrequency(
  channelData: Float32Array,
  sampleRate: number
): number {
  // Simple autocorrelation-based pitch detection
  const minPeriod = Math.floor(sampleRate / 800); // ~800 Hz max
  const maxPeriod = Math.floor(sampleRate / 80); // ~80 Hz min

  let bestPeriod = minPeriod;
  let maxCorrelation = 0;

  for (
    let period = minPeriod;
    period <= Math.min(maxPeriod, channelData.length / 2);
    period++
  ) {
    let correlation = 0;
    const samples = Math.min(period * 3, channelData.length - period);

    for (let i = 0; i < samples; i++) {
      correlation += channelData[i] * channelData[i + period];
    }

    correlation /= samples;

    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestPeriod = period;
    }
  }

  return maxCorrelation > 0.3 ? sampleRate / bestPeriod : 0;
}

function calculateZeroCrossingRate(channelData: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < channelData.length; i++) {
    if (channelData[i] >= 0 !== channelData[i - 1] >= 0) {
      crossings++;
    }
  }
  return crossings / (channelData.length - 1);
}

function calculateDurationSimilarity(
  duration1: number,
  duration2: number
): number {
  const diff = Math.abs(duration1 - duration2);
  const maxDuration = Math.max(duration1, duration2, 0.1);
  return Math.max(0, 100 - (diff / maxDuration) * 100);
}

function calculateEnergySimilarity(energy1: number, energy2: number): number {
  const maxEnergy = Math.max(energy1, energy2, 0.001);
  const minEnergy = Math.min(energy1, energy2);
  return (minEnergy / maxEnergy) * 100;
}

function calculateSpectralSimilarity(
  centroid1: number,
  centroid2: number
): number {
  if (centroid1 === 0 || centroid2 === 0) {
    return 50;
  }

  const diff = Math.abs(centroid1 - centroid2);
  const maxCentroid = Math.max(centroid1, centroid2);
  return Math.max(0, 100 - (diff / maxCentroid) * 100);
}

function calculatePitchSimilarity(freq1: number, freq2: number): number {
  if (freq1 === 0 || freq2 === 0) {
    return 50; // neutral if pitch not detected
  }

  // Compare in log scale (musical intervals)
  const logRatio = Math.abs(Math.log2(freq1 / freq2));
  const semitones = logRatio * 12; // Convert to semitones

  // Penalize differences > 2 semitones heavily
  if (semitones > 2) {
    return Math.max(0, 100 - (semitones - 2) * 20);
  }

  return Math.max(0, 100 - semitones * 25);
}

function calculateRhythmSimilarity(zcr1: number, zcr2: number): number {
  const maxZcr = Math.max(zcr1, zcr2, 0.001);
  const minZcr = Math.min(zcr1, zcr2);
  return (minZcr / maxZcr) * 100;
}
