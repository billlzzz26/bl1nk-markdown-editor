import { NextRequest, NextResponse } from "next/server";
import { CONVEX_URL } from "@/lib/env";

const CONVEX_ACTION_ENDPOINTS = {
  addMessageToThread: "/api/addMessageToThread",
  createThread: "/api/createThread",
  deleteNote: "/api/deleteNote",
  getNote: "/api/getNote",
  getNotesByTag: "/api/getNotesByTag",
  getThread: "/api/getThread",
  listNotes: "/api/listNotes",
  listThreads: "/api/listThreads",
  saveNote: "/api/saveNote",
  searchNotes: "/api/searchNotes",
  updateNote: "/api/updateNote",
} as const;

type ConvexAction = keyof typeof CONVEX_ACTION_ENDPOINTS;

function isConvexAction(value: unknown): value is ConvexAction {
  return typeof value === "string" && value in CONVEX_ACTION_ENDPOINTS;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, args } = body;

    if (!CONVEX_URL) {
      return NextResponse.json(
        { error: "CONVEX_URL not configured" },
        { status: 500 }
      );
    }

    if (!isConvexAction(action)) {
      return NextResponse.json(
        { error: "Unsupported Convex action" },
        { status: 400 }
      );
    }

    const targetUrl = new URL(CONVEX_ACTION_ENDPOINTS[action], CONVEX_URL);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Convex error: ${response.status} - ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Convex proxy route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
