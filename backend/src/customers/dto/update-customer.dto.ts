import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(1)
  sentiment_score?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  satisfaction_rating?: number;
}
