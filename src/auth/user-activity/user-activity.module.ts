import { Module } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { UserActivityController } from './user-activity.controller';

@Module({
  controllers: [UserActivityController],
  providers: [UserActivityService],
})
export class UserActivityModule {}
