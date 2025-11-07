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

// FIXED: Proper range format for updating
export async function updateSheet(sheetName: string, rowIndex: number, row: any[]) {
  try {
    console.log(`Updating ${sheetName} row ${rowIndex}:`, row);

    // Calculate the end column based on row length
    const endColumn = String.fromCharCode(65 + row.length - 1); // A=65, so if 7 columns, 65+6=71='G'
    const range = `${sheetName}!A${rowIndex}:${endColumn}${rowIndex}`;

    console.log(`Using range: ${range}`);

    const result = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    console.log(`Update successful:`, result.data);
    return result;
  } catch (error) {
    console.error(`Error updating ${sheetName} at row ${rowIndex}:`, error);
    throw error;
  }
}

export async function deleteRows(sheetName: string, startRow: number, endRow: number) {
  try {
    const sheetsResponse = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetsResponse.data.sheets?.find(s => s.properties?.title === sheetName);

    if (!sheet || !sheet.properties) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    const sheetId = sheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: startRow - 1,
              endIndex: endRow
            }
          }
        }]
      }
    });

    console.log(`Deleted rows ${startRow} to ${endRow} from ${sheetName}`);
  } catch (error) {
    console.error(`Error deleting rows:`, error);
    throw error;
  }
}
