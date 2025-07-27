'use server';

import { Client, handle_file } from '@gradio/client';
import z from 'zod';
import { createServerAction } from 'zsa';
import { CHOICE } from '@/app/choice/choice';

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
      bonus: z.number(),
    })
  )
  .handler(async ({ input }) => {
    const choice = CHOICE.find((c) => c.id === input.id);
    if (!choice) {
      throw new Error('Choice not found');
    }

    const score = await calculateAcousticSimilarity(input.audio, choice.mp3);

    return {
      score: score.score,
      bonus: score.bonus,
    };
  });

async function calculateAcousticSimilarity(
  uploadedAudio: File,
  referenceUrl?: string
): Promise<{
  score: number;
  bonus: number;
}> {
  if (!referenceUrl) {
    return {
      score: 0,
      bonus: 0,
    };
  }

  try {
    const client = await Client.connect('eaysu/Voice-Similarity-Checker');
    const result = await client.predict('/analyze_voice_similarity', {
      audio_file1: handle_file(uploadedAudio),
      audio_file2: handle_file(referenceUrl),
    });

    const data = result.data as unknown[];

    const resultString = z.string().parse(data[0]);

    const randomBonus = Math.floor(Math.random() * 21); // 0-20 inclusive
    const score = Number.parseFloat(resultString) * 100 + 10 + randomBonus;
    return {
      score,
      bonus: randomBonus,
    };
  } catch {
    return {
      score: 0,
      bonus: 0,
    };
  }
}
