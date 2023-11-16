import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseHistoryDto } from './create-purchase-history.dto';

export class UpdatePurchaseHistoryDto extends PartialType(
  CreatePurchaseHistoryDto,
) {}
