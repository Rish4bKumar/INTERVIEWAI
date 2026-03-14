// src/pages/ResumeAnalyzer.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { saveResumeHistoryRecord } from "@/utils/resumeHistory";

const API_URL = "http://127.0.0.1:5000/analyze";

const professions = [
  { value: "software_engineer", label: "Software Engineer" },
  { value: "data_analyst", label: "Data Analyst" },
  { value: "digital_marketer", label: "Digital Marketer" },
  { value: "graphic_designer", label: "Graphic Designer" },
  { value: "human_resource", label: "Human Resource" },
];

const ResumeAnalyzer = () => {
  const [profession, setProfession] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf" || ext === "docx") {
        setSelectedFile(file);
        setError(null);
      } else {
        setSelectedFile(null);
        setError("Upload only PDF or DOCX files.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!profession) {
      setError("Please select a profession.");
      return;
    }
    if (!selectedFile) {
      setError("Please upload a resume file.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("profession", profession);
      formData.append("file", selectedFile); // FIXED — backend expects "file"

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        let historyId: string | null = null;
        if (user?.id) {
          const saved = saveResumeHistoryRecord(
            user.id,
            selectedFile.name,
            data,
            "ats",
          );
          historyId = saved.id;
        }

        if (historyId) {
          navigate(`/resume-results?historyId=${encodeURIComponent(historyId)}`, {
            state: { results: data },
          });
        } else {
          navigate("/resume-results", { state: { results: data } });
        }
      } else {
        setError(data.error || "Failed to analyze resume.");
      }
    } catch (err) {
      console.log(err);
      setError("Backend not reachable. Make sure Flask is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Analyze Your Resume (ATS)
      </h1>

      <div className="max-w-3xl mx-auto p-10 border rounded-xl shadow-lg border-dashed border-gray-300">
        <div className="flex flex-col items-center space-y-4">

          {/* Profession Select */}
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="border rounded-md px-4 py-2 w-full"
          >
            <option value="">Select Profession</option>
            {professions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <Upload className="w-12 h-12 text-primary" />
          <p className="text-lg font-semibold">Upload Resume</p>
          <p className="text-sm text-muted-foreground">
            PDF / DOCX formats supported
          </p>

          <input
            id="file-upload"
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleFileChange}
          />

          <label
            htmlFor="file-upload"
            className="bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-md cursor-pointer"
          >
            Choose File
          </label>

          {selectedFile && (
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="w-4 h-4" /> {selectedFile.name}
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center">
                Analyze Resume
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </div>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
