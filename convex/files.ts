import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listFiles = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db
      .query("files")
      .order("desc")
      .take(100);
    return files;
  },
});

export const getFile = query({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    return file;
  },
});

export const getFilesByNote = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_noteId", (q) => q.eq("noteId", args.noteId))
      .collect();
    return files;
  },
});

export const searchFiles = query({
  args: { search: v.string() },
  handler: async (ctx, args) => {
    const allFiles = await ctx.db.query("files").take(100);
    const searchLower = args.search.toLowerCase();
    return allFiles.filter(
      (file) =>
        file.name.toLowerCase().includes(searchLower) ||
        file.type.toLowerCase().includes(searchLower)
    );
  },
});

export const saveFile = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    size: v.number(),
    url: v.string(),
    noteId: v.optional(v.id("notes")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const fileId = await ctx.db.insert("files", {
      name: args.name,
      type: args.type,
      size: args.size,
      url: args.url,
      noteId: args.noteId,
      createdAt: now,
      updatedAt: now,
    });
    return fileId;
  },
});

export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) {
      throw new Error("File not found");
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});
