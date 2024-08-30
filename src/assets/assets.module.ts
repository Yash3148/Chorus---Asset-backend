import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './schemas/assets.entity';
import { CsvHelperService } from 'src/helpers/csvHelper.service';
import { AssetRepository } from './repository/asset.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset]), // Register the Asset entity
  ],
  controllers: [AssetsController],
  providers: [
    AssetsService,
    CsvHelperService,
    AssetRepository, // Provide the custom repository
  ],
})
export class AssetsModule {}
