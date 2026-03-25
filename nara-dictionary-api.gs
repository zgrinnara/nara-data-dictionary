/**
 * Nara Data Dictionary — Google Apps Script API
 * ──────────────────────────────────────────────
 * Deploy this as a Web App:
 *   1. In the spreadsheet, go to Extensions → Apps Script
 *   2. Paste this entire file, replacing any existing code
 *   3. Click Deploy → New deployment → Web app
 *      • Execute as: Me
 *      • Who has access: Anyone with Google account (or "Anyone" if your org allows)
 *   4. Click Deploy, authorize the permissions
 *   5. Copy the Web App URL and paste it into the HTML app Settings panel
 *
 * No changes needed to the code below — it auto-detects your spreadsheet.
 */

const SPREADSHEET_ID = '1v0R4INmwPLz9FOp_l4iRyv3yj3XDWGun2SCB15J7D-c';

// ── Entry Points ──────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    switch (data.action) {

      // Append a new row to any tab
      case 'append': {
        const sheet = getSheet(ss, data.tab);
        sheet.appendRow(data.values);
        return ok({ action: 'append', tab: data.tab, rows: 1 });
      }

      // Append multiple rows at once (e.g. bulk changelog)
      case 'appendMany': {
        const sheet = getSheet(ss, data.tab);
        data.rows.forEach(row => sheet.appendRow(row));
        return ok({ action: 'appendMany', tab: data.tab, rows: data.rows.length });
      }

      // Find a metric row by name (col A) and update a single column
      case 'updateCell': {
        const sheet = getSheet(ss, data.tab || 'KPI Dictionary');
        const rowNum = findRow(sheet, data.metricName);
        if (!rowNum) return err(`Metric not found: "${data.metricName}"`);
        const colNum = colLetterToNumber(data.col);
        sheet.getRange(rowNum, colNum).setValue(data.value);
        return ok({ action: 'updateCell', row: rowNum, col: data.col });
      }

      // Find a metric row by name (col A) and update multiple columns at once
      case 'updateCells': {
        const sheet = getSheet(ss, data.tab || 'KPI Dictionary');
        const rowNum = findRow(sheet, data.metricName);
        if (!rowNum) return err(`Metric not found: "${data.metricName}"`);
        data.updates.forEach(({ col, value }) => {
          const colNum = colLetterToNumber(col);
          sheet.getRange(rowNum, colNum).setValue(value);
        });
        return ok({ action: 'updateCells', row: rowNum, count: data.updates.length });
      }

      // Find a metric row and return it (for pre-filling update form)
      case 'getRow': {
        const sheet = getSheet(ss, data.tab || 'KPI Dictionary');
        const rowNum = findRow(sheet, data.metricName);
        if (!rowNum) return err(`Metric not found: "${data.metricName}"`);
        const values = sheet.getRange(rowNum, 1, 1, 36).getValues()[0];
        return ok({ action: 'getRow', row: rowNum, values });
      }

      // List all metric names from col A (for search/autocomplete)
      case 'listMetrics': {
        const sheet = getSheet(ss, 'KPI Dictionary');
        const values = sheet.getRange('A2:A').getValues();
        const names = values.map(r => r[0]).filter(Boolean);
        return ok({ action: 'listMetrics', names });
      }

      // List data source names from col A
      case 'listSources': {
        const sheet = getSheet(ss, 'Data Sources');
        const values = sheet.getRange('A2:A').getValues();
        const names = values.map(r => r[0]).filter(Boolean);
        return ok({ action: 'listSources', names });
      }

      default:
        return err(`Unknown action: "${data.action}"`);
    }
  } catch (ex) {
    return err(ex.message || String(ex));
  }
}

// Health check — lets the HTML app verify the URL is valid
function doGet(e) {
  return ok({ status: 'connected', name: 'Nara Data Dictionary API', version: '1.0' });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getSheet(ss, tabName) {
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error(`Tab not found: "${tabName}"`);
  return sheet;
}

function findRow(sheet, metricName) {
  const colA = sheet.getRange('A:A').getValues();
  const idx = colA.findIndex(r => String(r[0]).trim().toLowerCase() === String(metricName).trim().toLowerCase());
  return idx >= 0 ? idx + 1 : null; // 1-indexed; null if not found
}

// Converts column letter(s) to a 1-indexed number (A→1, B→2, … AJ→36)
function colLetterToNumber(letters) {
  letters = letters.toUpperCase();
  let num = 0;
  for (let i = 0; i < letters.length; i++) {
    num = num * 26 + (letters.charCodeAt(i) - 64);
  }
  return num;
}

function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function err(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
