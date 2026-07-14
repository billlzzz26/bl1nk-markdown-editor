"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, HardDrive } from "lucide-react";
import Link from "next/link";
import { FileList, type AppFile } from "@/components/files/file-list";
import { FileUploader } from "@/components/files/file-uploader";

export default function FilesPage() {
  const [files, setFiles] = useState<AppFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listFiles", args: {} }),
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (file: File) => {
    // Upload via data URL for now — in production, use a proper upload API
    return new Promise<void>(async (resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          if (!dataUrl) return reject(new Error("Failed to read file"));

          const res = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "saveFile",
              args: {
                name: file.name,
                type: file.type,
                size: file.size,
                url: dataUrl,
              },
            }),
          });

          if (res.ok) {
            await fetchFiles();
            setShowUpload(false);
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteFile", args: { id } }),
      });
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-neutral-950">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
        <Link
          href="/"
          className="flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          <HardDrive className="size-5 text-accent-teal" />
          <h1 className="text-sm font-semibold text-white">Files</h1>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="rounded-lg bg-accent-teal px-3 py-1.5 text-xs font-medium text-black hover:bg-accent-teal-dim transition-colors"
          >
            {showUpload ? "Cancel" : "Upload"}
          </button>
        </div>
      </header>

      {/* Upload area */}
      {showUpload && (
        <div className="border-b border-neutral-800 px-4 py-3">
          <FileUploader onUpload={handleUpload} />
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-hidden">
        <FileList files={files} onDelete={handleDelete} loading={loading} />
      </div>
    </div>
  );
}
