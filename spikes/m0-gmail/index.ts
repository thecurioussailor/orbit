// Spike script: prove that the Gmail API can give Orbit the data it needs.
// Not production code — single file, no abstractions, delete after the spike.

import fs from "fs/promises";
import path from "path";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";

// Two copies of google-auth-library end up in the dependency tree (one
// nested inside googleapis-common) with slightly different types, so we
// use any for the client here rather than fight TypeScript over it.
// Fine for a throwaway spike.
type AuthClient = any;

// We only need to read mail, never send/modify/delete.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

// A rough filter for "recruiter-ish" emails. Good enough for a spike —
// Orbit's real classification logic will replace this later.
const RECRUITER_QUERY =
  'newer_than:30d (subject:(recruiter OR recruiting OR "job opportunity" OR interview OR role OR position) OR from:(recruiter OR talent OR careers OR jobs))';

// Try to reuse a token we saved from a previous run, so the user doesn't
// have to go through the OAuth consent screen every time.
async function loadSavedCredentialsIfExist(): Promise<AuthClient | null> {
  try {
    const content = await fs.readFile(TOKEN_PATH, "utf-8");
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials) as AuthClient;
  } catch (err) {
    return null;
  }
}

// After a fresh OAuth login, write the resulting token to disk so the next
// run can skip the login flow.
async function saveCredentials(client: AuthClient): Promise<void> {
  const content = await fs.readFile(CREDENTIALS_PATH, "utf-8");
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

// Get an authenticated client: reuse a saved token if we have one, otherwise
// run the desktop app OAuth flow (opens a browser window for consent).
async function authorize(): Promise<AuthClient> {
  const saved = await loadSavedCredentialsIfExist();
  if (saved) {
    return saved;
  }

  const client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  if (client.credentials) {
    await saveCredentials(client);
  }

  return client;
}

// List recruiter-ish threads from the last 30 days and print the key fields
// Orbit would care about: sender, subject, date, snippet.
async function listRecruiterThreads(auth: AuthClient) {
  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: RECRUITER_QUERY,
    maxResults: 10,
  });

  const messages = listRes.data.messages || [];

  if (messages.length === 0) {
    console.log("No recruiter-related emails found in the last 30 days.");
    return [];
  }

  console.log(`Found ${messages.length} recruiter-related email(s):\n`);

  const summaries: { id: string; from: string; subject: string; date: string; snippet: string }[] = [];

  for (const message of messages) {
    if (!message.id) continue;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });
    const headers = detail.data.payload?.headers || [];
    const from = headers.find((h) => h.name === "From")?.value || "(unknown sender)";
    const subject = headers.find((h) => h.name === "Subject")?.value || "(no subject)";
    const date = headers.find((h) => h.name === "Date")?.value || "(no date)";
    const snippet = detail.data.snippet || "";

    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Date:    ${date}`);
    console.log(`Snippet: ${snippet}`);
    console.log("---");

    summaries.push({ id: message.id, from, subject, date, snippet });
  }

  return summaries;
}

// Gmail returns MIME parts nested in a tree, and body data is base64url
// encoded. Walk the tree looking for a text/plain part; fall back to
// text/html with tags stripped if that's all we get.
function extractPlainTextBody(payload: any): string {
  if (!payload) return "";

  const decode = (data: string) => Buffer.from(data, "base64").toString("utf-8");

  // Simple, single-part message.
  if (payload.body?.data && !payload.parts) {
    const text = decode(payload.body.data);
    return payload.mimeType === "text/html" ? stripHtml(text) : text;
  }

  // Multipart message: look for a text/plain part first.
  const parts: any[] = payload.parts || [];

  const plainPart = parts.find((p) => p.mimeType === "text/plain" && p.body?.data);
  if (plainPart) {
    return decode(plainPart.body.data);
  }

  const htmlPart = parts.find((p) => p.mimeType === "text/html" && p.body?.data);
  if (htmlPart) {
    return stripHtml(decode(htmlPart.body.data));
  }

  // Nested multipart (e.g. multipart/alternative inside multipart/mixed).
  for (const part of parts) {
    if (part.parts) {
      const nested = extractPlainTextBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Fetch one full message by id and print its cleaned body text.
async function printMessageBody(auth: AuthClient, messageId: string) {
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const body = extractPlainTextBody(res.data.payload);

  console.log("\n=== Full body of selected message ===\n");
  console.log(body || "(could not extract a text body)");
}

async function main() {
  try {
    const auth = await authorize();
    const threads = await listRecruiterThreads(auth);

    if (threads.length > 0) {
      // Just grab the first result as "the selected thread" for this spike.
      await printMessageBody(auth, threads[0].id);
    }
  } catch (err) {
    console.error("Spike failed:", err);
    process.exit(1);
  }
}

main();