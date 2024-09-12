import { Injectable, Logger } from '@nestjs/common';
import { AssetRepository } from './repository/asset.repository';
import { CsvHelperService } from 'src/helpers/csvHelper.service';
import { Asset } from './schemas/assets.entity';
import {
  GroupByFilterDto,
  SearchFilterAssetsDto,
} from './dto/searchFilterAssets.dto';
import * as fs from 'fs';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AssetsService {
  private readonly logger: Logger = new Logger(AssetsService.name);
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly csvHelperService: CsvHelperService, // Injecting CsvHelperService
    private readonly userService: UserService,
  ) {}

  async createAsset(assetData: Partial<Asset>): Promise<Asset> {
    return this.assetRepository.createAsset(assetData);
  }

  async getAssetByDeviceId(deviceId: string): Promise<Asset> {
    return this.assetRepository.findAssetByDeviceId(deviceId);
  }

  async processCsvWithComparision(filePath: string): Promise<any> {
    const startTime = Date.now();
    try {
      // Step 1: Process the CSV to get asset data
      const csvAssets = await this.csvHelperService.processCsv(filePath);

      // Step 2: Fetch all existing assets from the database for comparison
      const existingAssets = await this.assetRepository.findAllAssets(); // Fetch all assets from DB

      // Create a map of existing assets by unique identifiers (deviceId, tagNumber, organizationId)
      const existingAssetsMap = new Map(
        existingAssets.map((asset) => [
          `${asset.deviceId}_${asset.tagNumber}_${asset.organizationId}`,
          asset,
        ]),
      );

      // Create a set of keys in the CSV data for easier lookup later
      const csvAssetKeys = new Set(
        csvAssets.map(
          (assetData) =>
            `${assetData.deviceId}_${assetData.tagNumber}_${assetData.organizationId}`,
        ),
      );

      let updatedRows = 0;
      let newCreatedRows = 0;

      // Step 3: Update or create assets based on CSV data
      for (const assetData of csvAssets) {
        const key = `${assetData.deviceId}_${assetData.tagNumber}_${assetData.organizationId}`;
        const existingAsset = await existingAssetsMap.get(key);

        if (existingAsset) {
          // Asset exists in both CSV and DB; update the existing asset
          await this.assetRepository.updateAsset(existingAsset, assetData);
          updatedRows += 1;
          existingAssetsMap.delete(key); // Remove from map after processing
        } else {
          // Asset exists in CSV but not in DB; create a new asset
          await this.assetRepository.createAsset(assetData);
          newCreatedRows += 1;
        }
      }

      // Step 4: Delete assets that exist in DB but not in CSV
      let deletedRows = 0;
      for (const [key, asset] of existingAssetsMap) {
        if (!csvAssetKeys.has(key)) {
          // Asset exists in DB but not in CSV; delete it
          await this.assetRepository.deleteAsset(asset);
          deletedRows += 1;
        }
      }

      // Log results
      this.logger.log('CSV file processed successfully.');
      this.logger.log(
        `Rows updated: ${updatedRows}, Rows created: ${newCreatedRows}, Rows deleted: ${deletedRows}`,
      );

      // Delete the file after processing
      fs.unlink(filePath, (err) => {
        if (err) {
          this.logger.error(`Error deleting file: ${filePath}`, err);
        } else {
          this.logger.log(`Successfully deleted file: ${filePath}`);
        }
      });

      // End time for processing in milliseconds
      const endTime = Date.now();
      const processingTime = (endTime - startTime).toFixed(3); // Calculate processing time in milliseconds

      this.logger.log(`Total processing time: ${processingTime} ms`);
      return { message: 'CSV file processed successfully.' };
    } catch (error) {
      // Handle the error here
      this.logger.error(`Error processing CSV file: ${error.message}`);
      // Optionally, you can throw the error further or handle it as needed
      return { message: `Failed to process CSV: ${error.message}` };
    }
  }

  // asset.service.ts
  async loadCsvDataToStageTable(filePath: string): Promise<void> {
    // Step 1: Read CSV data
    const csvAssets = await this.csvHelperService.processCsv(filePath);

    // Step 3: Insert CSV data into the staging table
    await this.assetRepository.saveStageAsset(csvAssets);

    this.logger.log('CSV data loaded into staging table successfully.');
  }

  async processCsvWithStageComparision(filePath: string): Promise<any> {
    const startTime = Date.now();
    try {
      // Load CSV data into the staging table
      await this.loadCsvDataToStageTable(filePath);

      // Synchronize the main asset table with the staging table
      await this.assetRepository.syncAssetsWithStageTable();

      // End time for processing in milliseconds
      const endTime = Date.now();
      const processingTime = (endTime - startTime).toFixed(3); // Calculate processing time in milliseconds

      // Delete the file after processing
      fs.unlink(filePath, (err) => {
        if (err) {
          this.logger.error(`Error deleting file: ${filePath}`, err);
        } else {
          this.logger.log(`Successfully deleted file: ${filePath}`);
        }
      });

      this.logger.log(`Total processing time: ${processingTime} ms`);
      return { message: 'CSV file processed and synchronized successfully.' };
    } catch (error) {
      // Handle the error here
      this.logger.error(`Error processing CSV file: ${error.message}`);
      return { message: `Failed to process CSV: ${error.message}` };
    }
  }

  async getAssets(
    assetsSeachFilterDto: SearchFilterAssetsDto,
    userEmail: string,
  ): Promise<Asset[]> {
    const {
      filter = {},
      searchQuery = '',
      skip = 0,
      limit = 10,
    } = assetsSeachFilterDto;

    const assetsList = await this.assetRepository.getAssets(
      filter,
      searchQuery,
      skip,
      limit,
    );

    console.log(userEmail, searchQuery);
    if (searchQuery) {
      await this.userService.saveSearch(userEmail, searchQuery);
    }
    return assetsList;
  }

  async getGroupBy(groupBy: GroupByFilterDto): Promise<any> {
    const { location, description } = groupBy;
    // const total = await this.assetRepository.groupByDescription();
    // const monitored = await this.assetRepository.countNotUnableToLocate();
    const res = await this.assetRepository.getMonitoringData();
    return res;
  }

  async getAssetsByDescription(
    description: string,
    skip: number,
    limit: number,
  ): Promise<any> {
    const totalCount =
      await this.assetRepository.getTotalCountGroupedByDescription(description);
    const assetsDetails = await this.assetRepository.getAssetsByDescription(
      description,
      skip,
      limit,
    );
    return { assetsDetails, totalCount };
  }

  async getAllFloor() {
    return await this.assetRepository.getAllFloor();
  }

  async getAssetsByFloor(floor: string) {
    return await this.assetRepository.getAssetCountsByFloorDepartmentAndZone(
      floor,
    );
  }

  async getAssetByDepartment(
    floorNumber: string,
    department: string,
  ): Promise<any> {
    return await this.assetRepository.getMonitoringData(
      floorNumber,
      department,
    );
  }

  async getAssetByDescriptionForDepartmentAndFloor(
    floor,
    department,
    description,
  ): Promise<any> {
    return await this.assetRepository.getAssetByFloorDepartmentAndDescription(
      floor,
      department,
      description,
    );
  }
}
