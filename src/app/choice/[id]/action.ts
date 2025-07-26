"use server";

import z from "zod";
import { createServerAction } from "zsa";

export const calculateVoiceSim = createServerAction()
  .input(
    z.object({
      audio: z.instanceof(File),
    }),
    {
      type: "formData",
    }
  )
  .handler(async ({ input }) => {
    return {
      score: 100.0,
    };
  });
