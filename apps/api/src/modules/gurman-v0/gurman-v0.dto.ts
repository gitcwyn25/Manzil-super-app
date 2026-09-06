import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class GurmanV0IntentDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  radius?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  groupSize?: number;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}
