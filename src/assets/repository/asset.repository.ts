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
    return await this.repository.findOne({
      where: {
        deviceId,
      },
    });
  }

  async findAssetToUpdate(
    deviceId: string,
    tagNumber: string,
    organizationId: string,
  ): Promise<Asset> {
    return await this.repository.findOne({
      where: {
        deviceId,
        tagNumber,
        organizationId,
      },
    });
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
        'asset.deviceId ILIKE :search OR ' +
          'asset.zoneId ILIKE :search OR ' +
          'asset.description ILIKE :search OR ' +
          'asset.zoneCategory ILIKE :search OR ',
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

  async getMonitoringData(
    floorNumber?: string,
    departmentName?: string,
  ): Promise<any> {
    // return this.repository
    //   .createQueryBuilder('asset')
    //   .select('asset.description', 'description')
    //   .addSelect('COUNT(asset.id)', 'totalCount')
    //   .addSelect(
    //     '(COUNT(asset.id) - ' +
    //       'SUM(CASE WHEN asset.egressEventTime IS NOT NULL AND asset.status = :egressStatus THEN 1 ELSE 0 END) - ' +
    //       'SUM(CASE WHEN asset.status = :unableToLocateStatus THEN 1 ELSE 0 END))',
    //     'monitoringCount',
    //   )
    //   .addSelect(
    //     'ROUND(((COUNT(asset.id) - ' +
    //       'SUM(CASE WHEN asset.egressEventTime IS NOT NULL AND asset.status = :egressStatus THEN 1 ELSE 0 END) - ' +
    //       'SUM(CASE WHEN asset.status = :unableToLocateStatus THEN 1 ELSE 0 END))::NUMERIC / COUNT(asset.id)) * 100, 2)',
    //     'monitoringPercentage',
    //   )
    //   .groupBy('asset.description')
    //   .setParameters({
    //     egressStatus: 'Egress',
    //     unableToLocateStatus: 'Unable To Locate',
    //   })
    //   .getRawMany();
    const query = this.repository
      .createQueryBuilder('asset')
      .select('asset.description', 'description')
      .addSelect('COUNT(asset.id)', 'totalCount')
      .addSelect(
        '(COUNT(asset.id) - ' +
          'SUM(CASE WHEN asset.egressEventTime IS NOT NULL AND asset.status = :egressStatus THEN 1 ELSE 0 END) - ' +
          'SUM(CASE WHEN asset.status = :unableToLocateStatus THEN 1 ELSE 0 END))',
        'monitoringCount',
      )
      .addSelect(
        'ROUND(((COUNT(asset.id) - ' +
          'SUM(CASE WHEN asset.egressEventTime IS NOT NULL AND asset.status = :egressStatus THEN 1 ELSE 0 END) - ' +
          'SUM(CASE WHEN asset.status = :unableToLocateStatus THEN 1 ELSE 0 END))::NUMERIC / COUNT(asset.id)) * 100, 2)',
        'monitoringPercentage',
      )
      .groupBy('asset.description')
      .setParameters({
        egressStatus: 'Egress',
        unableToLocateStatus: 'Unable To Locate',
      });

    // Conditionally add the department filter
    if (departmentName && floorNumber) {
      query.andWhere('asset.department = :departmentName', { departmentName });
    }

    // Conditionally add the floorNumber filter
    if (floorNumber) {
      query.andWhere('asset.floor = :floorNumber', { floorNumber });
    }
    // Execute and return the query results
    return await query.getRawMany();
  }

  async getTotalCountGroupedByDescription(description: string): Promise<any> {
    return this.repository
      .createQueryBuilder('asset')
      .where('asset.description = :description', { description })
      .getCount();
  }

  async getAssetsByDescription(
    description: string,
    skip: number,
    limit: number,
  ): Promise<Asset[]> {
    return this.repository
      .createQueryBuilder('asset')
      .where('asset.description = :description', { description })
      .skip(skip)
      .take(limit)
      .getMany();
  }

  async getAllFloor() {
    const distinctFloors = await this.repository
      .createQueryBuilder('asset')
      .select('DISTINCT(asset.floor)', 'floor')
      .getRawMany();

    return distinctFloors;
  }

  async getAssetCountsByFloorDepartmentAndZone(floor: string): Promise<any[]> {
    return this.repository
      .createQueryBuilder('asset')
      .select('asset.department', 'department')
      .addSelect('asset.zoneId', 'zoneId')
      .addSelect('COUNT(*)', 'assetCount')
      .where('asset.floor = :floor', { floor })
      .groupBy('asset.department')
      .addGroupBy('asset.zoneId')
      .getRawMany();
  }
}
