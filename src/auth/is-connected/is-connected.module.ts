import { Module } from '@nestjs/common';
import { IsConnectedService } from './is-connected.service';
import { IsConnectedController } from './is-connected.controller';

@Module({
  controllers: [IsConnectedController],
  providers: [IsConnectedService],
})
export class IsConnectedModule {}
