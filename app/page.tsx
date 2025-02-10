"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { generateDataAction } from "@/actions/generate-actions";
import Papa from "papaparse";
import { ChangeEvent } from "react";

interface PreviewData {
  [key: string]: string | number | boolean | null;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [zodSchemaText, setZodSchemaText] = useState("");
  const [csvData, setCsvData] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const result = await generateDataAction({ prompt, zodSchemaText });
      if (result.isSuccess) {
        setCsvData(result.data.csv);
        // Use PapaParse to parse the CSV for preview display
        const parsed = Papa.parse(result.data.csv, { header: true });
        setPreviewData(parsed.data as PreviewData[]);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while generating data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-8 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold">LLM Dataset Generator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="font-medium block">Enter Prompt:</label>
          <Textarea
            value={prompt}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setPrompt(e.target.value)
            }
            placeholder="Example: Generate 5 users with names and ages between 20-40"
            className="h-32"
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium block">Enter Zod Schema:</label>
          <Textarea
            value={zodSchemaText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setZodSchemaText(e.target.value)
            }
            placeholder={`Example:
z.object({
  name: z.string(),
  age: z.number().min(20).max(40)
})`}
            className="h-32 font-mono"
          />
        </div>
      </div>

      <div className="flex justify-start">
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !prompt || !zodSchemaText}
          className="w-32"
        >
          {isLoading ? "Generating..." : "Generate"}
        </Button>
      </div>

      {previewData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Preview Data</h2>
            <Button onClick={handleDownload} variant="outline">
              Download CSV
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0]).map((key) => (
                      <TableCell key={key} className="font-medium">
                        {key}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.values(row).map((cell, i) => (
                        <TableCell key={i}>{String(cell)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
