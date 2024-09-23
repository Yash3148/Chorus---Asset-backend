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

    const parseDate = (
      dateString: string | null,
      hoursToSubtract: number = 0,
    ) => {
      const parsedDate = Date.parse(dateString); // Parse the date string
      if (!isNaN(parsedDate)) {
        const date = new Date(parsedDate);
        date.setHours(date.getHours() - hoursToSubtract);
        return date;
      }
      return null; // Return null if date is invalid
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
        zoneCategory = zoneCategoryMatch[0].toUpperCase();
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
      lastSeenTime: parseDate(extractField(['Last Seen Time']), 5), // Now subtracting 5 hours
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
}
