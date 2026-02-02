// exporters.js
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

export async function exportToXlsx(columns, rows, filename = 'data.xlsx') {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Logs');

  sheet.addRow(columns.map((col) => col.header));
  rows.forEach((row) => {
    sheet.addRow(columns.map((col) => row[col.accessorKey]));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer]);
  saveAs(blob, filename);
}

export function exportToCsv(columns, rows, filename = 'data.csv') {
  const csv = Papa.unparse([
    columns.map((col) => col.header),
    ...rows.map((row) => columns.map((col) => row[col.accessorKey])),
  ]);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}
