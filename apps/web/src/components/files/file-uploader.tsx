"use client";

import { useState, useRef, type DragEvent } from "react";
import { Upload, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUploader({ onUpload, accept, maxSizeMB = 10 }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragOver(true);
    if (e.type === "dragleave") setDragOver(false);
  };

  const validate = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large (max ${maxSizeMB}MB)`;
    }
    return null;
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const error = validate(file);
    if (error) return alert(error);
    setSelectedFile(file);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validate(file);
    if (error) return alert(error);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-6 text-center transition-all",
        dragOver
          ? "border-accent-teal bg-accent-teal/5"
          : "border-glass-border hover:border-neutral-600",
        selectedFile && "border-accent-teal/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleSelect}
        className="hidden"
      />

      {!selectedFile ? (
        <div className="space-y-3">
          <div className="flex justify-center">
            <Upload className="size-8 text-neutral-400" />
          </div>
          <div>
            <p className="text-sm text-neutral-300">
              <button
                onClick={() => inputRef.current?.click()}
                className="text-accent-teal hover:underline"
              >
                Click to upload
              </button>{" "}
              or drag and drop
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {accept ? accept.split(",").join(", ") : "Any file"} &middot; Max {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <FileIcon className="size-5 text-accent-teal" />
            <span className="text-sm text-white truncate max-w-[200px]">{selectedFile.name}</span>
            <button
              onClick={() => { setSelectedFile(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="text-neutral-400 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="rounded-lg bg-accent-teal px-4 py-1.5 text-sm font-medium text-black hover:bg-accent-teal-dim transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-glass-border px-4 py-1.5 text-sm text-neutral-300 hover:text-white transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
