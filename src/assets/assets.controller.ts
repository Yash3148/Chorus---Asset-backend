import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import {
  GroupByFilterDto,
  SearchFilterAssetsDto,
} from './dto/searchFilterAssets.dto';
import { Asset } from './schemas/assets.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('assets')
// @UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('/upload-csv')
  async uploadCsv(@Body('filePath') filePath: string): Promise<void> {
    return this.assetsService.processCsv(filePath);
  }

  @Post('/search')
  @HttpCode(HttpStatus.OK)
  async getAssets(
    @Body() assetsSeachFilterDto: SearchFilterAssetsDto,
  ): Promise<Asset[]> {
    return this.assetsService.getAssets(assetsSeachFilterDto);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  async getAssetByDeviceId(@Param('id') deviceId: string): Promise<Asset> {
    return this.assetsService.getAssetByDeviceId(deviceId);
  }

  @Post('/assetsList')
  @HttpCode(HttpStatus.OK)
  async getAssetsBy(@Body() groupBy: GroupByFilterDto): Promise<any> {
    return this.assetsService.getGroupBy(groupBy);
  }

  @Get('/description/all')
  @HttpCode(HttpStatus.OK)
  async getAssetsByDescription(
    @Query('description') description: string,
    @Query('skip') skip = 0,
    @Query('limit') limit = 10,
  ): Promise<any> {
    return this.assetsService.getAssetsByDescription(
      description,
      Number(skip),
      Number(limit),
    );
  }

  @Get('/floor/all')
  async getAllFoor() {
    return this.assetsService.getAllFloor();
  }

  @Get('/floor/:floorNumber')
  async getAssetsByFloor(
    @Param('floorNumber') floorNumber: string,
  ): Promise<any> {
    return this.assetsService.getAssetsByFloor(floorNumber);
  }
}
