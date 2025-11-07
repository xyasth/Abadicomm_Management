import path from "path";
import { google } from "googleapis";

const KEYFILEPATH = path.join(process.cwd(), "credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = '1sWQTqJuOc7K5LHxzsLHZZHV3Wdag7TAWfCLt1aOxYno';

export async function readSheet(range: string) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values || [];
}

export async function appendSheet(range: string, row: any[]) {
  try {
    console.log(`Appending to ${range}:`, row);

    const fullRange = range.includes('!') ? range : `${range}!A:Z`;

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: fullRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    console.log(`Append successful:`, result.data.updates);
    return result;
  } catch (error) {
    console.error(`Error appending to ${range}:`, error);
    throw error;
  }
}

export async function getNextId(range: string): Promise<number> {
  const rows = await readSheet(range);
  if (rows.length === 0) return 1;

  const ids = rows.map(r => parseInt(r[0] || "0")).filter(id => !isNaN(id));
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

export async function batchAppendSheet(range: string, rows: any[][]) {
  if (rows.length === 0) return;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}
