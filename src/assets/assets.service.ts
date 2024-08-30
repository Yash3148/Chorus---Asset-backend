import { Injectable } from '@nestjs/common';
import { AssetRepository } from './repository/asset.repository';
import { CsvHelperService } from 'src/helpers/csvHelper.service';
import { Asset } from './schemas/assets.entity';
import { SearchFilterAssetsDto } from './dto/searchFilterAssets.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly csvHelperService: CsvHelperService, // Injecting CsvHelperService
  ) {}

  async createAsset(assetData: Partial<Asset>): Promise<Asset> {
    return this.assetRepository.createAsset(assetData);
  }

  async findAssetByDeviceId(deviceId: string): Promise<Asset> {
    return this.assetRepository.findAssetByDeviceId(deviceId);
  }

  async processCsv(filePath: string): Promise<void> {
    const assets = await this.csvHelperService.processCsv(filePath);
    for (const assetData of assets) {
      console.log(assetData);
      const existingAsset = await this.findAssetByDeviceId(assetData.deviceId);
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
      search = '',
      skip = 0,
      limit = 10,
    } = assetsSeachFilterDto;

    const assetsList = await this.assetRepository.getAssets(
      filter,
      search,
      skip,
      limit,
    );
    return assetsList;
  }
}
