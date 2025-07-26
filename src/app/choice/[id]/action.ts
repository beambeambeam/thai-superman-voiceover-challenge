"use server";

import { CHOICE } from "@/app/choice/choice";
import z from "zod";
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
  .handler(async ({ input }) => {
    const choice = CHOICE.find((c) => c.id === input.id);

    if (!choice) {
      throw new Error("Choice not found");
    }

    console.log(input);

    return {
      score: 100.0,
    };
  });
