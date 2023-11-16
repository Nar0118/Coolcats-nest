import { BadRequestException, Injectable, Req } from '@nestjs/common';
import { CreateSyncQuestDto } from './dto/create-sync-quest.dto';
import { UpdateSyncQuestDto } from './dto/update-sync-quest.dto';
import { TUserReferenceQuest, Util } from '../../util';
import { User } from '../../entity/user';
import { getManager } from 'typeorm';
import { QuestSelection } from '../../entity/quest-selection';
import { Request } from 'express';

@Injectable()
export class SyncQuestsService {
  async create(createSyncQuestDto: CreateSyncQuestDto, @Req() req: Request) {
    /**
     * Make sure service is available
     */
    const serviceUnavailable: boolean = await Util.serviceUnavailable(
      (req as any).ethAddress,
    );
    if (serviceUnavailable) {
      throw new BadRequestException(
        'Service is temporarily unavailable, please try again later',
      );
    }

    await Util.mustHavePetOrCat((req as any).ethAddress);

    const success = await this.resyncSelectedQuests((req as any).ethAddress);

    return {
      account: (req as any).ethAddress,
      adjusted: success,
    };
  }

  findAll() {
    return `This action returns all syncQuests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} syncQuest`;
  }

  update(id: number, updateSyncQuestDto: UpdateSyncQuestDto) {
    return `This action updates a #${id} syncQuest`;
  }

  remove(id: number) {
    return `This action removes a #${id} syncQuest`;
  }

  /**
   * Re-syncs user selected quests with blockchain
   * @param account
   * @private
   */
  async resyncSelectedQuests(account: string): Promise<boolean> {
    let toRet = false;
    try {
      const userQuests: TUserReferenceQuest[] =
        await Util.getUserQuestsFromBlockchain(account);
      await getManager().transaction(async (transactionalEntityManager) => {
        const user: User | undefined =
          await transactionalEntityManager.findOne<User>(User, {
            where: {
              account,
            },
          });
        if (user) {
          // Delete the old one (if there was one)
          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from<QuestSelection>(QuestSelection)
            .where('userId = :uid', { uid: user.id })
            .execute();

          if (userQuests.length > 0) {
            // Add back the user quests
            const questSelection = new QuestSelection();
            questSelection.user = user;
            questSelection.quests = JSON.stringify(userQuests);
            questSelection.entropy = 0;
            await transactionalEntityManager
              .getRepository<QuestSelection>(QuestSelection)
              .save(questSelection);
          }
          toRet = true;
        }
      });
    } catch (error) {
      // TODO: Log error with newrelic
      console.log(error);
    }
    return toRet;
  }
}
