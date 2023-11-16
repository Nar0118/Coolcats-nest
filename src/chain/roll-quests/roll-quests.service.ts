import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreateRollQuestDto } from './dto/create-roll-quest.dto';
import { UpdateRollQuestDto } from './dto/update-roll-quest.dto';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { QuestSelection } from '../../entity/quest-selection';
import { getRepository } from 'typeorm';
import { ethers } from 'ethers';
import { Environment } from '../../environment';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { Util } from '../../util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class RollQuestsService {
  async create(createRollQuestDto: CreateRollQuestDto, @Req() req: Request) {
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

    const selection: QuestSelection | undefined =
      await getRepository<QuestSelection>(QuestSelection).findOne({
        relations: ['user'],
        where: {
          user: { account: (req as any).ethAddress },
        },
      });

    const reRoll: boolean = createRollQuestDto.reRoll.toLowerCase() === 'true';

    if (selection && !reRoll) {
      throw new BadRequestException(
        `You cannot roll quests if you already have quests in your selection.`,
      );
    }
    if (!selection && reRoll) {
      throw new BadRequestException(
        `User does not have quests already. Should use reRoll = false instead.`,
      );
    }

    // Grab our cool pets contract
    const blockchainContractRepo =
      getRepository<BlockchainContract>(BlockchainContract);
    const coolPetContract: BlockchainContract | undefined =
      await blockchainContractRepo.findOne({
        where: {
          code: 'COOLPET_721',
          mode: Environment.env.MODE,
        },
      });
    if (!coolPetContract) {
      throw new NotFoundException('COOLPET_721 contract not found');
    }

    // get the addresses currently owned pets
    const contractRepository = getRepository<CoolcatOwner>(CoolcatOwner);
    const ownedPets = await contractRepository.find({
      where: {
        to: (req as any).ethAddress,
        blockchainContract: coolPetContract,
      },
    });

    if (ownedPets.length === 0) {
      throw new NotFoundException('Must own a pet to roll quests');
    }

    // -----------------------------------------------------------
    // IF WE GET HERE, THE USER HAS QUESTS AND WE ARE RE-ROLLING,
    // OR THE USER HAS NO QUESTS AND WE ARE ROLLING.
    // -----------------------------------------------------------

    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'ROLL_USER_QUEST',
        guid,
        user: (req as any).ethAddress,
        reRoll,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `RollUserQuests`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all rollQuests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rollQuest`;
  }

  update(id: number, updateRollQuestDto: UpdateRollQuestDto) {
    return `This action updates a #${id} rollQuest`;
  }

  remove(id: number) {
    return `This action removes a #${id} rollQuest`;
  }
}
