import { Injectable } from '@nestjs/common';
import { AssetRepository } from './repository/asset.repository';
import { CsvHelperService } from 'src/helpers/csvHelper.service';
import { Asset } from './schemas/assets.entity';
import {
  GroupByFilterDto,
  SearchFilterAssetsDto,
} from './dto/searchFilterAssets.dto';

@Injectable()
export class AssetsService {
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

  async processCsv(filePath: string): Promise<void> {
    const assets = await this.csvHelperService.processCsv(filePath);
    for (const assetData of assets) {
      console.log(assetData);
      const existingAsset = await this.getAssetByDeviceId(assetData.deviceId);
      if (existingAsset) {
        await this.assetRepository.updateAsset(existingAsset, assetData);
      } else {
        await this.assetRepository.createAsset(assetData);
      }
    }

    console.log('CSV file successfully processed');
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
    console.log(description);
    const totalCount =
      await this.assetRepository.getTotalCountGroupedByDescription(description);
    const assetsDetails = await this.assetRepository.getAssetsByDescription(
      description,
      skip,
      limit,
    );
    return { assetsDetails, totalCount };
  }
<<<<<<< HEAD

  async getAllFloor() {
    return await this.assetRepository.getAllFloor();
  }
=======
>>>>>>> origin/main
}
