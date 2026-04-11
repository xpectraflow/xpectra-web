"use client";

import React, { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  AlertCircle,
  Database,
  Activity,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { DataMapper, MappingState } from "@/components/datasets/DataMapper";

type Step = "experiment" | "upload" | "mapping" | "ingesting";

interface ChannelInfo {
  sensorId: string;
  sensorName: string;
  channelIndex: number;
  experimentChannelIndex: number;
}

export default function CreateDatasetPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("experiment");
  
  // Form State
  const [name, setName] = useState("");
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  
  // File State
  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [filePreviewRows, setFilePreviewRows] = useState<string[][]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Mapping State
  const [mapping, setMapping] = useState<MappingState>({
    timestampColumn: null,
    channelMappings: {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: experiments = [], isLoading: loadingExperiments } = trpc.experiments.getExperiments.useQuery();
  const { data: sensors = [] } = trpc.sensors.getSensors.useQuery();

  const selectedExperiment = experiments.find(e => e.id === selectedExperimentId);
  const availableChannels: ChannelInfo[] = useMemo(() => {
    const channels: ChannelInfo[] = [];
    if (selectedExperiment?.sensorConfig?.sensors) {
      selectedExperiment.sensorConfig.sensors.forEach(sConfig => {
        const sensor = sensors.find(s => s.id === sConfig.sensorId);
        const indices = sConfig.channelIndices || [];
        indices.forEach((expIdx, localIdx) => {
          channels.push({
            sensorId: sConfig.sensorId,
            sensorName: sensor?.name || `Sensor ${sConfig.sensorId.slice(0, 4)}`,
            channelIndex: localIdx,
            experimentChannelIndex: expIdx,
          });
        });
      });
    }
    return channels;
  }, [selectedExperiment, sensors]);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setParsing(true);
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    try {
      if (extension === "csv" || extension === "txt" || extension === "tsv") {
        Papa.parse(selectedFile, {
          preview: 20,
          complete: (results) => {
            const lines = results.data as string[][];
            if (lines.length > 0) {
              setFileHeaders(lines[0]);
              setFilePreviewRows(lines.slice(1, 11));
              setStep("mapping");
            }
            setParsing(false);
          },
          error: (err) => {
            toast.error(`CSV Parsing Error: ${err.message}`);
            setParsing(false);
          }
        });
      } else if (extension === "xlsx" || extension === "xls") {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (jsonData.length > 0) {
          setFileHeaders(jsonData[0]);
          setFilePreviewRows(jsonData.slice(1, 11));
          setStep("mapping");
        }
        setParsing(false);
      } else {
        toast.error("Unsupported file format.");
        setParsing(false);
      }
    } catch (err) {
      toast.error("Failed to parse file.");
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !selectedExperimentId || !mapping.timestampColumn || !file) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setUploading(true);
    setStep("ingesting");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("experimentId", selectedExperimentId);
    formData.append("name", name);
    formData.append("mapping", JSON.stringify(mapping));

    try {
      const response = await fetch("/api/datasets/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const result = await response.json();
      toast.success("Ingestion started! Redirecting...");
      
      // Wait a moment so the user sees the success state
      setTimeout(() => {
        router.push(`/experiments/${selectedExperimentId}/datasets/${result.datasetId}`);
      }, 1500);
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
      setStep("mapping");
      setUploading(false);
    }
  };

  return (
    <PageLayout 
      title="Create Dataset" 
      description="Ingest telemetry data into an experiment from a local file."
    >
      <div className="max-w-5xl mx-auto py-4">
        {step !== "ingesting" && (
          <div className="flex items-center justify-center mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0"></div>
            <div className="flex w-full justify-between z-10">
              <StepIndicator step="experiment" current={step} label="Select Experiment" icon={<Database className="h-4 w-4" />} />
              <StepIndicator step="upload" current={step} label="Upload File" icon={<Upload className="h-4 w-4" />} />
              <StepIndicator step="mapping" current={step} label="Map Channels" icon={<Check className="h-4 w-4" />} />
            </div>
          </div>
        )}

        <div className="min-h-[400px]">
          {step === "experiment" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Dataset Details</h2>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Dataset Name</label>
                    <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Bridge Test - Run #1"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Target Experiment</h2>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingExperiments ? (
                      <div className="flex items-center justify-center p-8 gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-sm font-medium">Loading experiments...</p>
                      </div>
                    ) : experiments.length === 0 ? (
                      <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card/50">
                        <p className="text-sm text-muted-foreground">No experiments found.</p>
                      </div>
                    ) : (
                      experiments.map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => setSelectedExperimentId(exp.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                            selectedExperimentId === exp.id 
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-card hover:border-primary/30 hover:bg-accent"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Activity className={cn("h-4 w-4", selectedExperimentId === exp.id ? "text-primary" : "text-muted-foreground")} />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{exp.name}</p>
                              <p className="text-xs text-muted-foreground">{exp.sensorConfig?.sensors?.length || 0} sensors configured</p>
                            </div>
                          </div>
                          {selectedExperimentId === exp.id && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <button
                  disabled={!name || !selectedExperimentId}
                  onClick={() => setStep("upload")}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 shadow-md shadow-primary/20"
                >
                  Continue to Upload <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if(f) processFile(f); }}
                className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center transition-all hover:border-primary/50 hover:bg-accent group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls,.txt,.tsv"
                  onChange={(e) => { const f = e.target.files?.[0]; if(f) processFile(f); }}
                />
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 transition-colors group-hover:bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-6 space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Click or Drag & Drop Data File</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Supported formats: CSV, Excel (XLSX/XLS), Text (TXT, TSV).
                  </p>
                </div>
                {parsing && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium text-primary">Parsing file structure...</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep("experiment")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" /> Back to Experiment
                </button>
              </div>
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DataMapper 
                headers={fileHeaders}
                rows={filePreviewRows}
                availableChannels={availableChannels}
                onMappingChange={setMapping}
              />
              <div className="flex justify-between pt-8 border-t border-border">
                <button onClick={() => setStep("upload")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" /> Change File
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={!mapping.timestampColumn}
                  className="rounded-lg bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/30"
                >
                  Start Ingestion
                </button>
              </div>
            </div>
          )}

          {step === "ingesting" && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Database className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-foreground">Ingesting Telemetry Data</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Streaming data directly to TimescaleDB. This may take a few moments depending on the file size.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function StepIndicator({ step, current, label, icon }: { step: Step; current: Step; label: string; icon: React.ReactNode }) {
  const steps: Step[] = ["experiment", "upload", "mapping"];
  const currentIdx = steps.indexOf(current);
  const stepIdx = steps.indexOf(step);
  const isCompleted = currentIdx > stepIdx;
  const isActive = current === step;

  return (
    <div className="flex flex-col items-center gap-3 w-32 group">
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-sm",
        isCompleted ? "bg-primary border-primary text-primary-foreground" : 
        isActive ? "bg-card border-primary text-primary ring-4 ring-primary/10" : 
        "bg-card border-border text-muted-foreground"
      )}>
        {isCompleted ? <Check className="h-5 w-5" /> : icon}
      </div>
      <p className={cn(
        "text-[10px] uppercase font-bold tracking-widest text-center transition-colors",
        isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
      )}>
        {label}
      </p>
    </div>
  );
}
