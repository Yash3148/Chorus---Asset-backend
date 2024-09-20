import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { Asset } from '../assets/schemas/assets.entity';

@Injectable()
export class CsvHelperService {
  async processCsv(filePath: string): Promise<Partial<Asset>[]> {
    const assets: Partial<Asset>[] = [];

    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found: ${filePath}`));
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const assetData = this.mapRowToAsset(row);
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
    const extractField = (fieldName: string) => {
      const regex = new RegExp(`${fieldName}`, 'i'); // case-insensitive search
      const matchedKey = Object.keys(row).find((key) => regex.test(key));
      return matchedKey ? row[matchedKey] : null;
    };

    const parseDate = (dateString: string | null) => {
      const parsedDate = Date.parse(dateString); // Parse the date string
      return !isNaN(parsedDate) ? new Date(parsedDate) : null; // Return valid Date object or null
    };

    const zoneId = extractField('Last Location');
    const floorMatch = zoneId.match(/(?<=FL)\d{2}/); // Match the floor pattern
    const floor = floorMatch ? parseInt(floorMatch[0], 10) : null;
    // let floor = null;
    // if (zoneId) {
    //   console.log(zoneId);
    //   floor = zoneId ? parseInt(zoneId.match(/(?<=FL)\d{2}/)[0], 10) : null;
    // }

    return {
      eventId: extractField('Event ID'),
      egressEventTime: parseDate(extractField('Egress Event')),
      deviceId: extractField('Device ID'),
      tagNumber: extractField('Tag Number'),
      description: extractField('Description'),
      manufacturer: extractField('Manufacturer'),
      modelNumber: extractField('Model Number'),
      lastSeenTime: parseDate(extractField('Last Seen Time')),
      lastLocation: extractField('Last Location'),
      previousEgressLocation: extractField('Previous Egress Location'),
      status: extractField('Status'),
      returnedAt: parseDate(extractField('Returned At')),
      unableToLocate:
        extractField('Unable to locate') === 'Y'
          ? true
          : extractField('Unable to locate') === 'N'
            ? false
            : null,
      zoneId: zoneId,
      zoneCategory: extractField('Zone Category'),
      floor: floor,
      department: extractField('Department'),
      organizationId: 'pa94',
    };
  }

  // private mapRowToAsset(row: any): Partial<Asset> {
  //   const zoneId = row['Zone ID'] || null;

  //   const floor = zoneId ? parseInt(zoneId.match(/(?<=FL)\d{2}/)[0], 10) : null;

  //   return {
  //     eventId: row['Event ID'] || null,
  //     egressEventTime: row['Egress Event Time (MM-DD-YYYY)']
  //       ? new Date(row['Egress Event Time (MM-DD-YYYY)'])
  //       : null,
  //     deviceId: row['Device ID'] || null,
  //     tagNumber: row['Tag Number'] || null,
  //     description: row['Description'] || null,
  //     manufacturer: row['Manufacturer'] || null,
  //     modelNumber: row['Model Number'] || null,
  //     lastSeenTime: row['Last Seen Time']
  //       ? new Date(row['Last Seen Time'])
  //       : null,
  //     lastLocation: row['Last Location'] || null,
  //     previousEgressLocation: row['Previous Egress Location'] || null,
  //     status: row['Status'] || null,
  //     returnedAt: row['Returned At'] ? new Date(row['Returned At']) : null,
  //     unableToLocate:
  //       row['Unable to locate'] === 'Y'
  //         ? true
  //         : row['Unable to locate'] === 'N'
  //           ? false
  //           : null,
  //     zoneId: zoneId,
  //     zoneCategory: row['Zone Category'] || null,
  //     floor: floor,
  //     department: row['Department'] || null,
  //     organizationId: 'pa94',
  //   };
  // }
}
