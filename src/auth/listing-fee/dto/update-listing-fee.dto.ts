import { PartialType } from '@nestjs/mapped-types';
import { CreateListingFeeDto } from './create-listing-fee.dto';

export class UpdateListingFeeDto extends PartialType(CreateListingFeeDto) {}
