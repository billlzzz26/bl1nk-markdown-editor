import { NextRequest, NextResponse } from "next/server";
import { CONVEX_URL } from "@/lib/env";

const NOTE_ACTION_ENDPOINTS = {
  deleteNote: "/api/deleteNote",
  getNotesByTag: "/api/getNotesByTag",
  listNotes: "/api/listNotes",
  saveNote: "/api/saveNote",
  searchNotes: "/api/searchNotes",
  updateNote: "/api/updateNote",
} as const;

type NoteAction = keyof typeof NOTE_ACTION_ENDPOINTS;

function isNoteAction(value: unknown): value is NoteAction {
  return typeof value === "string" && value in NOTE_ACTION_ENDPOINTS;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, args } = body;

    if (!CONVEX_URL) {
      return NextResponse.json({ error: "CONVEX_URL not configured" }, { status: 500 });
    }

    if (!isNoteAction(action)) {
      return NextResponse.json({ error: "Unsupported note action" }, { status: 400 });
    }

    const targetUrl = new URL(NOTE_ACTION_ENDPOINTS[action], CONVEX_URL);

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
    console.error("API route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
