import { NextRequest, NextResponse } from "next/server";
import { CONVEX_URL } from "@/lib/env";

const FILE_ACTION_ENDPOINTS = {
  listFiles: "/api/listFiles",
  getFile: "/api/getFile",
  getFilesByNote: "/api/getFilesByNote",
  searchFiles: "/api/searchFiles",
  saveFile: "/api/saveFile",
  deleteFile: "/api/deleteFile",
} as const;

type FileAction = keyof typeof FILE_ACTION_ENDPOINTS;

function isFileAction(value: unknown): value is FileAction {
  return typeof value === "string" && value in FILE_ACTION_ENDPOINTS;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, args } = body;

    if (!CONVEX_URL) {
      return NextResponse.json({ error: "CONVEX_URL not configured" }, { status: 500 });
    }

    if (!isFileAction(action)) {
      return NextResponse.json({ error: "Unsupported file action" }, { status: 400 });
    }

    const targetUrl = new URL(FILE_ACTION_ENDPOINTS[action], CONVEX_URL);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Convex error: ${response.status} - ${error}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Files API route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
