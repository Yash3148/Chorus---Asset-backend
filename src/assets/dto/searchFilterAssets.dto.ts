// src/assets/dto/filter-assets.dto.ts
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export interface FilterDTO {
  status?: string[];
  lastLocation?: string[];
}

export class SearchFilterAssetsDto {
  @IsOptional()
  filter?: FilterDTO;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly skip?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly limit?: number = 10;
}

export class GroupByFilterDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description: string;
}
