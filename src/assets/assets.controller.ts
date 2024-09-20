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
  Logger,
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
  private readonly logger = new Logger(AssetsController.name); // Initialize logger

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
      fileFilter: (req, file, cb) => {
        // Validate file type
        if (file.mimetype !== 'text/csv') {
          return cb(
            new BadRequestException('Only CSV files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string }> {
    const startTime = Date.now();
    this.logger.log('Upload CSV endpoint called');
    try {
      if (!file) {
        this.logger.warn('No file uploaded or file upload failed');
        throw new BadRequestException(
          'File upload failed or no file uploaded.',
        );
      }

      const filePath = file.path;
      if (!filePath) {
        this.logger.warn('File path is undefined after upload');
        throw new BadRequestException('File path is undefined.');
      }

      this.logger.log(`Processing CSV file at path: ${filePath}`);
      await this.assetsService.processCsvWithStageComparision(filePath);

      const endTime = Date.now();
      const timeTaken = (endTime - startTime).toFixed(3);
      this.logger.log(`CSV processing completed in ${timeTaken} ms`);

      return {
        success: true,
        message: 'CSV file uploaded and processed successfully.',
      };
    } catch (error) {
      this.logger.error(
        `Error uploading CSV file: ${error.message}`,
        error.stack,
      );
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
    this.logger.log('Search assets endpoint called');
    const assets = await this.assetsService.getAssets(
      assetsSeachFilterDto,
      req.user.email,
    );
    this.logger.log('Assets search completed');
    return assets;
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getAssetByDeviceId(@Param('id') deviceId: string): Promise<Asset> {
    this.logger.log(
      `Get asset by device ID endpoint called for ID: ${deviceId}`,
    );
    const asset = await this.assetsService.getAssetByDeviceId(deviceId);
    this.logger.log(`Asset retrieval completed for ID: ${deviceId}`);
    return asset;
  }

  @Post('/assetsList')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getAssetsBy(@Body() groupBy: GroupByFilterDto): Promise<any> {
    this.logger.log('Get assets list by group endpoint called');
    const assets = await this.assetsService.getGroupBy(groupBy);
    this.logger.log('Assets grouping retrieval completed');
    return assets;
  }

  @Get('/description/all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getAssetsByDescription(
    @Query('description') description: string,
    @Query('skip') skip = 0,
    @Query('limit') limit = 10,
  ): Promise<any> {
    this.logger.log(
      `Get assets by description endpoint called with description: ${description}`,
    );
    const assets = await this.assetsService.getAssetsByDescription(
      description,
      Number(skip),
      Number(limit),
    );
    this.logger.log('Assets retrieval by description completed');
    return assets;
  }

  @Get('/floor/all')
  @UseGuards(JwtAuthGuard)
  async getAllFoor() {
    this.logger.log('Get all floors endpoint called');
    const floors = await this.assetsService.getAllFloor();
    this.logger.log('All floors retrieval completed');
    return floors;
  }

  @Get('/floor/:floorNumber')
  @UseGuards(JwtAuthGuard)
  async getAssetsByFloor(
    @Param('floorNumber') floorNumber: string,
  ): Promise<any> {
    this.logger.log(
      `Get assets by floor endpoint called for floor number: ${floorNumber}`,
    );
    const assets = await this.assetsService.getAssetsByFloor(floorNumber);
    this.logger.log(
      `Assets retrieval completed for floor number: ${floorNumber}`,
    );
    return assets;
  }

  @Get('/floor/:floorNumber/:department/:zone')
  @UseGuards(JwtAuthGuard)
  async getAssetsByDepartment(
    @Param('floorNumber') floorNumber: string,
    @Param('department') department: string,
    @Param('zone') zone: string,
  ): Promise<any> {
    this.logger.log(
      `Get assets by department endpoint called for floor number: ${floorNumber}, department: ${department}, zone: ${zone}`,
    );
    const assets = await this.assetsService.getAssetByDepartment(
      floorNumber,
      department,
      zone,
    );
    this.logger.log('Assets retrieval by department completed');
    return assets;
  }

  @Get('/floor/:floorNumber/:department/:zone/:description')
  @UseGuards(JwtAuthGuard)
  async getAssetByDescriptionForDepartmentAndFloor(
    @Param('floorNumber') floorNumber: string,
    @Param('department') department: string,
    @Param('description') description: string,
    @Param('zone') zone: string,
  ): Promise<any> {
    this.logger.log(
      `Get asset by description for department and floor endpoint called for floor number: ${floorNumber}, department: ${department}, zone: ${zone}, description: ${description}`,
    );
    const assets =
      await this.assetsService.getAssetByDescriptionForDepartmentAndFloor(
        floorNumber,
        department,
        description,
        zone,
      );
    this.logger.log(
      'Assets retrieval by description for department and floor completed',
    );
    return assets;
  }
}
