import { PartialType } from '@nestjs/mapped-types';
import { CreateIsConnectedDto } from './create-is-connected.dto';

export class UpdateIsConnectedDto extends PartialType(CreateIsConnectedDto) {}
