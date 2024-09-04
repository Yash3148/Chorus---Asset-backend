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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import {
  GroupByFilterDto,
  SearchFilterAssetsDto,
} from './dto/searchFilterAssets.dto';
import { Asset } from './schemas/assets.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('assets')
// @UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  // @Post('/upload-csv')
  // async uploadCsv(@Body('filePath') filePath: string): Promise<void> {
  //   return this.assetsService.processCsv(filePath);
  // }

  @Post('/upload-csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Specify your desired upload directory
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const filePath = file.path; // Get the file path of the uploaded file
      return await this.assetsService.processCsv(filePath); // Process the CSV file using the service
    } catch (error) {
      console.error('Error uploading CSV file:', error.message);
      // return {
      //   success: false,
      //   message: `Failed to upload CSV file: ${error.message}`,
      // };
      throw new BadRequestException(`Failed to process CSV: ${error.message}`);
    }
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

  @Get('/floor/:floorNumber/:deparment')
  async getAssetsByDepartment(
    @Param('floorNumber') floorNumber: string,
    @Param('department') department: string,
  ): Promise<any> {
    return this.assetsService.getAssetByDepartment(floorNumber, department);
  }
}
