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

  async groupByLocation(): Promise<any> {
    return this.repository
      .createQueryBuilder('asset')
      .select('asset.lastLocation', 'location')
      .addSelect('COUNT(asset.id)', 'count')
      .groupBy('asset.lastLocation')
      .getRawMany();
  }

  async groupByDescription(): Promise<any> {
    return this.repository
      .createQueryBuilder('asset')
      .select('asset.description', 'description')
      .addSelect('COUNT(asset.id)', 'count')
      .groupBy('asset.description')
      .getRawMany();
  }

  async countNotUnableToLocate(): Promise<number> {
    return this.repository
      .createQueryBuilder('asset')
      .where('asset.status != :status', { status: 'Unable to locate' })
      .getCount();
  }

  async groupByDescriptionWithStatusCount(): Promise<any> {
    return this.repository
      .createQueryBuilder('asset')
      .select('asset.description', 'description')
      .addSelect('COUNT(asset.id)', 'Total')
      .addSelect(
        'SUM(CASE WHEN asset.status != :status THEN 1 ELSE 0 END)',
        'Monitoring',
      )
      .groupBy('asset.description')
      .setParameters({ status: 'Unable To Locate' })
      .getRawMany();
  }

  async getMonitoringData(): Promise<any> {
    return (
      this.repository
        .createQueryBuilder('asset')
        .select('asset.description', 'description')
        .addSelect('COUNT(asset.id)', 'totalCount')
        // .addSelect(
        //   'SUM(CASE WHEN asset.egressEventTime IS NOT NULL AND asset.status = :egressStatus THEN 1 ELSE 0 END)',
        //   'egressEventCount',
        // )
        // .addSelect(
        //   'SUM(CASE WHEN asset.status = :unableToLocateStatus THEN 1 ELSE 0 END)',
        //   'unableToLocateCount',
        // )
        .addSelect(
          '(COUNT(asset.id) - ' +
            'SUM(CASE WHEN asset.egressEventTime IS NOT NULL AND asset.status = :egressStatus THEN 1 ELSE 0 END) - ' +
            'SUM(CASE WHEN asset.status = :unableToLocateStatus THEN 1 ELSE 0 END))',
          'monitoringCount',
        )
        .groupBy('asset.description')
        .setParameters({
          egressStatus: 'Egress',
          unableToLocateStatus: 'Unable To Locate',
        })
        .getRawMany()
    );
  }
}
