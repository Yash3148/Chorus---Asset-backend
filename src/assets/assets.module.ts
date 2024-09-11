import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './schemas/assets.entity';
import { CsvHelperService } from 'src/helpers/csvHelper.service';
import { AssetRepository } from './repository/asset.repository';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([Asset]), // Register the Asset entity
  ],
  controllers: [AssetsController],
  providers: [AssetsService, CsvHelperService, AssetRepository],
})
export class AssetsModule {}
