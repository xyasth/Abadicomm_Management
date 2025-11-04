import path from "path";
import { google } from "googleapis";

const KEYFILEPATH = path.join(process.cwd(), "credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

export async function readSheet(range: string) {
  const spreadsheetId = '1sWQTqJuOc7K5LHxzsLHZZHV3Wdag7TAWfCLt1aOxYno';
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values || [];
}

export async function appendSheet(range: string, row: any[]) {
  const spreadsheetId = '1sWQTqJuOc7K5LHxzsLHZZHV3Wdag7TAWfCLt1aOxYno';
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}
