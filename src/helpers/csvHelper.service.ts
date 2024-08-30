import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { Asset } from '../assets/schemas/assets.entity';

@Injectable()
export class CsvHelperService {
  async processCsv(filePath: string): Promise<Partial<Asset>[]> {
    const assets: Partial<Asset>[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const assetData = this.mapRowToAsset(row);
          console.log(assetData);
          assets.push(assetData);
        })
        .on('end', () => {
          resolve(assets);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private mapRowToAsset(row: any): Partial<Asset> {
    const zoneId = row['Zone ID'] || null;

    const floor = zoneId ? zoneId.substring(2, 4) : null;

    return {
      eventId: row['Event ID'] || null,
      egressEventTime: row['Egress Event Time (MM-DD-YYYY)']
        ? new Date(row['Egress Event Time (MM-DD-YYYY)'])
        : null,
      deviceId: row['Device ID'] || null,
      tagNumber: row['Tag Number'] || null,
      description: row['Description'] || null,
      manufacturer: row['Manufacturer'] || null,
      modelNumber: row['Model Number'] || null,
      lastSeenTime: row['Last Seen Time']
        ? new Date(row['Last Seen Time'])
        : null,
      lastLocation: row['Last Location'] || null,
      previousEgressLocation: row['Previous Egress Location'] || null,
      status: row['Status'] || null,
      returnedAt: row['Returned At'] ? new Date(row['Returned At']) : null,
      unableToLocate: row['Unable to locate']
        ? row['Unable to locate'].toLowerCase() === 'true'
        : null,
      zoneId: zoneId,
      zoneCategory: row['Zone Category'] || null,
      floor: floor,
      department: row['Department'],
      organizationId: row['Organization Id'],
    };
  }
}
