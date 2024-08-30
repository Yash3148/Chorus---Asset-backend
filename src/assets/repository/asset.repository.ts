import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../schemas/assets.entity';
import { FilterDTO } from '../dto/searchFilterAssets.dto';

@Injectable()
export class AssetRepository {
  constructor(
    @InjectRepository(Asset)
    private readonly repository: Repository<Asset>,
  ) {}

  async createAsset(assetData: Partial<Asset>): Promise<Asset> {
    return await this.repository.save(assetData);
  }

  async findAssetByDeviceId(deviceId: string): Promise<Asset> {
    return await this.repository.findOne({ where: { deviceId } });
  }

  async updateAsset(asset: Asset, assetData: Partial<Asset>): Promise<Asset> {
    Object.assign(asset, assetData); // upade only the fields that are present in assetyData to asset
    return await this.repository.save(asset);
  }

  async getAssets(
    filters: FilterDTO,
    search: string,
    limit,
    skip,
  ): Promise<Asset[]> {
    const { status, lastLocation } = filters;

    const queryBuilder = this.repository.createQueryBuilder('asset');

    if (status && status.length > 0) {
      queryBuilder.andWhere('asset.status IN (:...statuses)', {
        statuses: status,
      });
    }

    if (lastLocation && lastLocation.length > 0) {
      queryBuilder.andWhere('asset.lastLocation IN (:...locations)', {
        locations: lastLocation,
      });
    }

    // if (lastSeenTime && lastSeenTime.length > 0) {
    //   const dates = lastSeenTime.map((dateStr) => new Date(dateStr));
    //   queryBuilder.andWhere('asset.lastSeenTime IN (:...dates)', { dates });
    // }

    if (search) {
      queryBuilder.andWhere(
        'asset.eventId ILIKE :search OR ' +
          'asset.deviceId ILIKE :search OR ' +
          'asset.tagNumber ILIKE :search OR ' +
          'asset.description ILIKE :search OR ' +
          'asset.manufacturer ILIKE :search OR ' +
          'asset.modelNumber ILIKE :search',
        { search: `%${search}%` },
      );
    }

    // Apply pagination
    queryBuilder.skip(skip || 0).take(limit || 10);

    return await queryBuilder.getMany();
  }

  async getGroupBy(loc);
}
