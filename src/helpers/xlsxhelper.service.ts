import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

@Injectable()
export class CsvHelperService {
  async readXlsxFile(filePath: string): Promise<any[]> {
    const results = [];
    return new Promise((resolve, reject) => {
      try {
        // Read the workbook
        const workbook = XLSX.readFile(filePath);
        // Get the first sheet name
        const sheetName = workbook.SheetNames[0];
        // Get the sheet data
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet data to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Map the rows to your desired format
        // Check if there is data to process
        if (jsonData.length > 0) {
          // Skip the header row (first row)
          jsonData.slice(1).forEach((row: any[]) => {
            if (row.length) {
              // Skip empty rows
              results.push(this.mapXlsxData(row));
            }
          });
        }
        resolve(results);
      } catch (err) {
        reject(err);
      }
    });
  }

  private mapXlsxData(row: any[]): any {
    return {
      eventId: row[1] || null,
      egressEventTime: row[2] || null,
      deviceId: row[3] || null,
      tagNumber: row[4] || null,
      description: row[5] || null,
      manufacturer: row[6] || null,
      modelNumber: row[7] || null,
      lastSeenTime: row[8] ? new Date(row[8]).toISOString() : null,
      lastLocation: row[9] || null,
      previousEgressLocation: row[10] || null,
      status: row[11] || null,
      returnedAt: row[12] || null,
      unableToLocate: row[13] || null,
      zoneId: row[14] || null,
      zoneCategory: row[15] || null,
    };
  }
}
