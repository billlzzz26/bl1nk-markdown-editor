import { defineOpenAPIConnection } from "eve/connections";

export default defineOpenAPIConnection({
  spec: "https://developers.notion.com/openapi.json",
  baseUrl: "https://api.notion.com",
  description: "Notion workspace: pages, databases, comments, and users. Search, read, create, and update Notion pages and databases.",
  headers: {
    Authorization: `Bearer ${process.env.NOTION_API_KEY || ""}`,
    "Notion-Version": "2022-06-28",
  },
  operations: {
    allow: [
      "Search",
      "RetrievePage",
      "RetrieveBlockChildren",
      "CreatePage",
      "UpdatePage",
      "AppendBlockChildren",
      "RetrieveDatabase",
      "QueryDatabase",
      "CreateDatabase",
      "ListDatabases",
      "RetrieveComment",
      "CreateComment",
    ],
  },
});
