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
  InternalServerErrorException,
  Req,
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
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('/upload-csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string }> {
    const startTime = Date.now();
    try {
      if (!file) {
        // Handle cases where the file is undefined
        throw new BadRequestException(
          'File upload failed or no file uploaded.',
        );
      }

      const filePath = file.path;
      if (!filePath) {
        throw new BadRequestException('File path is undefined.');
      }

      //use the below method if having some problem in processCsvWithStageComparision method
      // await this.assetsService.processCsvWithComparision(filePath);

      await this.assetsService.processCsvWithStageComparision(filePath);

      const endTime = Date.now();
      const timeTaken = (endTime - startTime).toFixed(3);
      console.log('asset controler time: ', timeTaken);

      return {
        success: true,
        message: 'CSV file uploaded and processed successfully.',
      };
    } catch (error) {
      console.error('Error uploading CSV file:', error.message);
      throw new InternalServerErrorException(
        `Failed to process CSV: ${error.message}`,
      );
    }
  }

  @Post('/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getAssets(
    @Body() assetsSeachFilterDto: SearchFilterAssetsDto,
    @Req() req,
  ): Promise<Asset[]> {
    return this.assetsService.getAssets(assetsSeachFilterDto, req.user.email);
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getAssetByDeviceId(@Param('id') deviceId: string): Promise<Asset> {
    return this.assetsService.getAssetByDeviceId(deviceId);
  }

  @Post('/assetsList')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getAssetsBy(@Body() groupBy: GroupByFilterDto): Promise<any> {
    return this.assetsService.getGroupBy(groupBy);
  }

  @Get('/description/all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async getAllFoor() {
    return this.assetsService.getAllFloor();
  }

  @Get('/floor/:floorNumber')
  @UseGuards(JwtAuthGuard)
  async getAssetsByFloor(
    @Param('floorNumber') floorNumber: string,
  ): Promise<any> {
    return this.assetsService.getAssetsByFloor(floorNumber);
  }

  @Get('/floor/:floorNumber/:department/:zone')
  @UseGuards(JwtAuthGuard)
  async getAssetsByDepartment(
    @Param('floorNumber') floorNumber: string,
    @Param('department') department: string,
    @Param('zone') zone: string,
  ): Promise<any> {
    return this.assetsService.getAssetByDepartment(
      floorNumber,
      department,
      zone,
    );
  }

  @Get('/floor/:floorNumber/:department/:zone/:description')
  @UseGuards(JwtAuthGuard)
  async getAssetByDescriptionForDepartmentAndFloor(
    @Param('floorNumber') floorNumber: string,
    @Param('department') department: string,
    @Param('description') description: string,
    @Param('zone') zone: string,
  ): Promise<any> {
    return this.assetsService.getAssetByDescriptionForDepartmentAndFloor(
      floorNumber,
      department,
      description,
      zone,
    );
  }
}
