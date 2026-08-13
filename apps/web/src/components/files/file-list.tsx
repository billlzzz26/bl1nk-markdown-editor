"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { FileCard, type AppFile } from "./file-card";
export type { AppFile };
import { cn } from "@/lib/utils";

const FILE_TYPES = ["all", "image", "pdf", "text", "other"] as const;
type FileTypeFilter = (typeof FILE_TYPES)[number];

interface FileListProps {
  files: AppFile[];
  onDelete?: (id: string) => void;
  loading?: boolean;
}

function matchTypeFilter(file: AppFile, filter: FileTypeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "image") return file.type.startsWith("image/");
  if (filter === "pdf") return file.type.includes("pdf");
  if (filter === "text") return file.type.startsWith("text/") || file.type.includes("markdown");
  return !file.type.startsWith("image/") && !file.type.includes("pdf") && !file.type.startsWith("text/") && !file.type.includes("markdown");
}

export function FileList({ files, onDelete, loading }: FileListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");

  const filtered = files.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (!matchTypeFilter(f, typeFilter)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + Filter */}
      <div className="space-y-2 p-4 border-b border-neutral-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full rounded-xl border border-glass-border bg-glass py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-teal transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {FILE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                typeFilter === t
                  ? "bg-accent-teal text-black"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              )}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Filter className="size-8 mb-2" />
            <p className="text-sm">No files found</p>
          </div>
        ) : (
          filtered.map((file) => (
            <FileCard key={file._id} file={file} onDelete={onDelete} />
          ))
        )}
      </div>

      {/* Footer count */}
      <div className="border-t border-neutral-800 px-4 py-2">
        <p className="text-xs text-neutral-500">
          {filtered.length} of {files.length} files
        </p>
      </div>
    </div>
  );
}
