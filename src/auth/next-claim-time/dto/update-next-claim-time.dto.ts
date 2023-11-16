import { PartialType } from '@nestjs/mapped-types';
import { CreateNextClaimTimeDto } from './create-next-claim-time.dto';

export class UpdateNextClaimTimeDto extends PartialType(
  CreateNextClaimTimeDto,
) {}
