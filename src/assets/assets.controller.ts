import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AssetsService } from './assets.service';
import {
  GroupByFilterDto,
  SearchFilterAssetsDto,
} from './dto/searchFilterAssets.dto';
import { Asset } from './schemas/assets.entity';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload-csv')
  async uploadCsv(@Body('filePath') filePath: string): Promise<void> {
    return this.assetsService.processCsv(filePath);
  }

  @Post('/search')
  async getAssets(
    @Body() assetsSeachFilterDto: SearchFilterAssetsDto,
  ): Promise<Asset[]> {
    return this.assetsService.getAssets(assetsSeachFilterDto);
  }

  @Get('/:id')
  async getAssetByDeviceId(@Param('id') deviceId: string): Promise<Asset> {
    return this.assetsService.getAssetByDeviceId(deviceId);
  }

  @Post('/by')
  async getAssetsBy(@Body() groupBy: GroupByFilterDto): Promise<any> {
    return this.assetsService.getGroupBy(groupBy);
  }
}
