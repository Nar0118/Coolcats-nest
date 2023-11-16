import { PartialType } from '@nestjs/mapped-types';
import { CreateAdventureClaimDto } from './create-adventure-claim.dto';

export class UpdateAdventureClaimDto extends PartialType(
  CreateAdventureClaimDto,
) {}
