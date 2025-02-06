"use server";

import { z } from "zod";
import { ActionState, GenerateRequest, GenerateResponse } from "@/types";
import Papa from "papaparse";
// Import the new LLM helpers as per the sample code
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Server action to generate structured data based on a prompt and Zod schema using generateObject.
 */
export async function generateDataAction(
  request: GenerateRequest
): Promise<ActionState<GenerateResponse>> {
  try {
    // Validate inputs
    if (!request.prompt || !request.zodSchemaText) {
      return {
        isSuccess: false,
        message: "Prompt and schema are required",
      };
    }

    // Create a safe evaluation context with access to z
    const createSchema = new Function("z", `return ${request.zodSchemaText}`);
    const schema: z.ZodTypeAny = createSchema(z);

    // Use generateObject to generate structured data using the provided prompt and schema.
    // The output option "array" forces the result to be an array of objects.
    const { object: generatedData } = await generateObject({
      model: openai("o3-mini"),
      output: "array",
      schema,
      prompt: request.prompt,
    });

    // Check that the LLM returned data.
    if (!generatedData) {
      throw new Error("No data generated from LLM.");
    }

    // Ensure we always have an array even if a single object is returned.
    const dataArray = Array.isArray(generatedData)
      ? generatedData
      : [generatedData];

    // Validate each item against the provided schema.
    const validatedData = dataArray.map((item) => schema.parse(item));

    // Convert the validated data to CSV using PapaParse.
    const csv = Papa.unparse(validatedData);

    return {
      isSuccess: true,
      message: "Data generated successfully",
      data: {
        csv,
        data: validatedData,
      },
    };
  } catch (error) {
    console.error("Error generating data:", error);
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to generate data",
    };
  }
}
