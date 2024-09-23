import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Asset } from '../schemas/assets.entity';
import { FilterDTO } from '../dto/searchFilterAssets.dto';
import { StageAsset } from '../schemas/stageAsset.entity';

@Injectable()
export class AssetRepository {
  private readonly logger = new Logger(AssetRepository.name);

  constructor(
    @InjectRepository(Asset)
    private readonly repository: Repository<Asset>,
    private readonly dataSource: DataSource,
    @InjectRepository(StageAsset)
    private readonly stageAssetRepository: Repository<StageAsset>,
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
          'asset.department ILIKE :search OR ' +
          'asset.tagNumber ILIKE :search OR ' +
          'asset.zoneCategory ILIKE :search ',
        { search: `%${search}%` },
      );
    }

    // Apply pagination
    // queryBuilder.skip(skip || 0).take(limit || 10); //uncommect after applying pagination in app

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
    zone?: string,
  ): Promise<any> {
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
    if (departmentName) {
      query.andWhere('asset.department = :departmentName', { departmentName });
    }

    // Conditionally add the floorNumber filter
    if (floorNumber) {
      query.andWhere('asset.floor = :floorNumber', { floorNumber });
    }

    if (zone) {
      query.andWhere('asset.zoneId = :zone', { zone });
    }

    query.orderBy('asset.description', 'ASC');
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
    return (
      this.repository
        .createQueryBuilder('asset')
        .where('asset.description = :description', { description })
        // .orderBy('asset.zoneCategory', 'ASC')
        .orderBy(
          "CASE WHEN asset.zoneCategory IN ('Non-Productive (NP)', 'Non-Productive', 'NP') THEN 1 WHEN asset.zoneCategory IN ('Productive (P)', 'Productive', 'P') THEN 2 WHEN asset.zoneCategory IS NULL THEN 3 END",
          'ASC',
        )
        .skip(skip)
        .take(limit)
        .getMany()
    );
  }

  async getAllFloor() {
    const distinctFloors = await this.repository
      .createQueryBuilder('asset')
      .select('DISTINCT(asset.floor)', 'floor')
      .where('asset.floor IS NOT NULL')
      .orderBy('asset.floor', 'ASC')
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

  async getAssetByFloorDepartmentAndDescription(
    floor: string,
    department: string,
    description: string,
    zone: string,
  ): Promise<any> {
    const [assets, totalCount] = await this.repository
      .createQueryBuilder('asset')
      .where('asset.floor = :floor', { floor })
      .andWhere('asset.department = :department', { department })
      .andWhere('asset.description = :description', { description })
      .andWhere('asset.zoneId = :zone', { zone })
      .getManyAndCount();

    return { assets, totalCount };
  }

  async findAllAssets(): Promise<Asset[]> {
    return await this.repository.find(); // Fetch all assets without any filter
  }

  async deleteAsset(asset: Asset): Promise<void> {
    await this.repository.remove(asset); // Remove the asset from the database
  }

  async syncAssetsWithStageTable(): Promise<void> {
    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Update existing records in the main table from the staging table
      await queryRunner.manager.query(`
        UPDATE assets
        SET 
          "eventId" = stage."eventId",
          description = stage.description,
          manufacturer = stage.manufacturer,
          "modelNumber" = stage."modelNumber",
          "egressEventTime" = stage."egressEventTime",
          "lastSeenTime" = stage."lastSeenTime",
          "lastLocation" = stage."lastLocation",
          "previousEgressLocation" = stage."previousEgressLocation",
          status = stage.status,
          "returnedAt" = stage."returnedAt",
          "unableToLocate" = stage."unableToLocate",
          "zoneId" = stage."zoneId",
          "zoneCategory" = stage."zoneCategory",
          floor = stage.floor,
          department = stage.department,
          "organizationId" = stage."organizationId"
        FROM "stageAssets" AS stage
        WHERE assets."deviceId" = stage."deviceId"
          AND assets."tagNumber" = stage."tagNumber"
          AND (assets."organizationId" = stage."organizationId" OR (assets."organizationId" IS NULL AND stage."organizationId" IS NULL))
      `);

      // Step 2: Insert new records from the staging table into the main table
      await queryRunner.manager.query(`
        INSERT INTO assets ("eventId", "deviceId", "tagNumber", description, manufacturer, "modelNumber", "egressEventTime",
                           "lastSeenTime", "lastLocation", "previousEgressLocation", status, "returnedAt",
                           "unableToLocate", "zoneId", "zoneCategory", floor, department, "organizationId")
        SELECT stage."eventId", stage."deviceId", stage."tagNumber", stage.description, stage.manufacturer, stage."modelNumber",
               stage."egressEventTime", stage."lastSeenTime", stage."lastLocation", stage."previousEgressLocation",
               stage.status, stage."returnedAt", stage."unableToLocate", stage."zoneId", stage."zoneCategory",
               stage.floor, stage.department, stage."organizationId"
        FROM "stageAssets" AS stage
        LEFT JOIN assets ON assets."deviceId" = stage."deviceId"
          AND assets."tagNumber" = stage."tagNumber"
          AND (assets."organizationId" = stage."organizationId" OR (assets."organizationId" IS NULL AND stage."organizationId" IS NULL))
        WHERE assets."deviceId" IS NULL
      `);

      // Step 3: Delete records from the main table that are not in the staging table
      await queryRunner.manager.query(`
        DELETE FROM assets
        WHERE ("deviceId", "tagNumber", COALESCE("organizationId", 'NULL')) NOT IN (
          SELECT "deviceId", "tagNumber", COALESCE("organizationId", 'NULL') FROM "stageAssets"
        )
      `);

      // Commit the transaction
      await queryRunner.commitTransaction();

      this.logger.log(
        'Assets synchronized with the staging table successfully.',
      );
    } catch (error) {
      // Rollback in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'Error synchronizing assets with the staging table:',
        error,
      );
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async saveStageAsset(csvAssets) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Clear the staging table before inserting new data
      await queryRunner.manager.clear(StageAsset); // Use clear to truncate the table and reset state

      // Step 2: Batch insert data into the staging table
      const batchSize = 1000; // Set a reasonable batch size
      for (let i = 0; i < csvAssets.length; i += batchSize) {
        const batch = csvAssets.slice(i, i + batchSize); // Create a batch of records
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(StageAsset)
          .values(batch)
          .execute();
      }

      // Step 3: Commit transaction
      await queryRunner.commitTransaction();
      this.logger.log('CSV data loaded into staging table successfully.');
    } catch (error) {
      await queryRunner.rollbackTransaction(); // Rollback transaction on error
      this.logger.error('Error loading CSV data to staging table:', error);
    } finally {
      await queryRunner.release(); // Release the query runner
    }
    // await this.stageAssetRepository.save(csvAssets);
  }
}
