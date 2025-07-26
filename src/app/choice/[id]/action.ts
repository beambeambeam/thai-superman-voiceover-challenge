"use server";

import z from "zod";
import { createServerAction } from "zsa";

export const calculateVoiceSim = createServerAction()
  .input(
    z.object({
      audio: z.instanceof(File),
      message: z.string(),
    }),
    {
      type: "formData",
    }
  )
  .handler(async ({ input }) => {
    console.log(input.audio.name);
    console.log(input.message);

    return {
      score: 100.0,
    };
  });
