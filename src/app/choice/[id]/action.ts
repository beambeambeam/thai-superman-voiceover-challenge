"use server";

import z from "zod";
import { createServerAction } from "zsa";

export const calculateVoiceSim = createServerAction()
  .input(
    z.object({
      audio: z.file(),
    }),
    {
      type: "formData",
    }
  )
  .output(
    z.object({
      score: z.float64(),
    })
  )
  .handler(async () => {
    return {
      score: 100.0,
    };
  });
