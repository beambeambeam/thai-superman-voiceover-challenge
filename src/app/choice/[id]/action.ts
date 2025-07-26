"use server";

import { CHOICE } from "@/app/choice/choice";
import z, { number } from "zod";
import { createServerAction } from "zsa";

export const calculateVoiceSim = createServerAction()
  .input(
    z.object({
      id: z.string(),
      audio: z.instanceof(File),
    }),
    {
      type: "formData",
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
      throw new Error("Choice not found");
    }

    let score = 0;
    try {
      const arrayBuffer = await input.audio.arrayBuffer();
      const uploadedSize = arrayBuffer.byteLength;

      let refSize = 1;
      if (choice.mp3) {
        const res = await fetch(choice.mp3);
        if (res.ok) {
          const refBuffer = await res.arrayBuffer();
          refSize = refBuffer.byteLength;
        }
      }

      const diff = Math.abs(uploadedSize - refSize);
      score = Math.max(0, 100 - (diff / Math.max(refSize, 1)) * 100);
    } catch (e) {
      score = 0;
    }
    return {
      score: Math.round(score * 10) / 10,
    };
  });
