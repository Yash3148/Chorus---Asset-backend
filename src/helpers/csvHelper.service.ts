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
          if (assetData) {
            assets.push(assetData);
          }
        })
        .on('end', () => {
          resolve(assets);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private mapRowToAsset(row: any): Partial<Asset> | null {
    const extractField = (fieldNames: string[]) => {
      const regex = new RegExp(fieldNames.join('|'), 'i'); // case-insensitive search for multiple field names
      const matchedKey = Object.keys(row).find((key) => regex.test(key));
      return matchedKey ? row[matchedKey] : null;
    };

    const parseDate = (dateString: string | null) => {
      const parsedDate = Date.parse(dateString); // Parse the date string
      return !isNaN(parsedDate) ? new Date(parsedDate) : null; // Return valid Date object or null
    };

    const description = extractField(['Description']);
    const lastLocation = extractField(['Last Location']);

    if (!description || !lastLocation) {
      return null;
    }

    const zoneId = lastLocation;

    const isNotInZone = zoneId?.toLowerCase() === 'notinzone';

    const floorMatch =
      zoneId && !isNotInZone ? zoneId.match(/(?<=FL)\d{2}/) : null;
    const floor = isNotInZone ? 'NotInZone' : floorMatch ? floorMatch[0] : null;

    let zoneCategory = extractField(['Zone Category']);
    if (!zoneCategory && lastLocation && lastLocation !== 'NotInZone') {
      const zoneCategoryMatch = lastLocation.match(/FL\d{2}(P|NP)\d*/i);
      if (zoneCategoryMatch) {
        zoneCategory = zoneCategoryMatch[1].toUpperCase();
      }
    }

    return {
      eventId: extractField(['Event ID']),
      egressEventTime: parseDate(extractField(['Egress Event'])),
      deviceId: extractField(['Device ID']),
      tagNumber: extractField(['Tag Number']),
      description: description,
      manufacturer: extractField(['Manufacturer']),
      modelNumber: extractField(['Model Number']),
      lastSeenTime: parseDate(extractField(['Last Seen Time'])),
      lastLocation: lastLocation,
      previousEgressLocation: extractField(['Previous Egress Location']),
      status: extractField(['Status']),
      returnedAt: parseDate(extractField(['Returned At'])),
      unableToLocate:
        extractField(['Unable to locate']) === 'Y'
          ? true
          : extractField(['Unable to locate']) === 'N'
            ? false
            : null,
      zoneId: zoneId,
      zoneCategory: zoneCategory,
      floor: floor,
      department: extractField(['Department', 'Departement']) || 'Unknown', // Handling both 'Department' and 'Departement'
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
