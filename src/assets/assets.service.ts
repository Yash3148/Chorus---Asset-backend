import { Injectable, Logger } from '@nestjs/common';
import { AssetRepository } from './repository/asset.repository';
import { CsvHelperService } from 'src/helpers/csvHelper.service';
import { Asset } from './schemas/assets.entity';
import {
  GroupByFilterDto,
  SearchFilterAssetsDto,
} from './dto/searchFilterAssets.dto';
import * as fs from 'fs';

@Injectable()
export class AssetsService {
  private readonly logger: Logger = new Logger(AssetsService.name);
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly csvHelperService: CsvHelperService, // Injecting CsvHelperService
  ) {}

  async createAsset(assetData: Partial<Asset>): Promise<Asset> {
    return this.assetRepository.createAsset(assetData);
  }

  async getAssetByDeviceId(deviceId: string): Promise<Asset> {
    return this.assetRepository.findAssetByDeviceId(deviceId);
  }

  async processCsv(filePath: string): Promise<any> {
    try {
      const assets = await this.csvHelperService.processCsv(filePath);

      let updatedRows = 0;
      let newCreatedRows = 0;
      for (const assetData of assets) {
        const existingAsset = await this.assetRepository.findAssetToUpdate(
          assetData.deviceId,
          assetData.tagNumber,
          assetData.organizationId,
        );

        if (existingAsset) {
          await this.assetRepository.updateAsset(existingAsset, assetData);
          updatedRows += 1;
        } else {
          await this.assetRepository.createAsset(assetData);
          newCreatedRows += 1;
        }
      }
      this.logger.log('CSV file processed successfully.');
      this.logger.log(
        `Rows updated: ${updatedRows}, Rows Created: ${newCreatedRows}`,
      );

      // Delete the file after processing
      fs.unlink(filePath, (err) => {
        if (err) {
          this.logger.error(`Error deleting file: ${filePath}`, err);
        } else {
          this.logger.log(`Successfully deleted file: ${filePath}`);
        }
      });
      return { message: 'CSV file processed successfully.' };
    } catch (error) {
      // Handle the error here
      console.error(`Error processing CSV file: ${error.message}`);
      // Optionally, you can throw the error further or handle it as needed
      return { message: `Failed to process CSV: ${error.message}` };
    }
  }

  async getAssets(
    assetsSeachFilterDto: SearchFilterAssetsDto,
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
