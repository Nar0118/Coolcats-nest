import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreateCompleteQuestDto } from './dto/create-complete-quest.dto';
import { UpdateCompleteQuestDto } from './dto/update-complete-quest.dto';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { QuestSelection } from '../../entity/quest-selection';
import { getRepository } from 'typeorm';
import { ethers } from 'ethers';
import { Environment } from '../../environment';
import { QuestIo, Status } from '../../entity/quest-io';
import { Coolpets } from '../../entity/coolpets';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Util } from '../../util';
import { StakedPet } from '../../entity/staked-pet';
import { Element } from '../../entity/quest-history';
import { ERedisKey } from '../../utility/enums';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class CompleteQuestService {
  async create(
    createCompleteQuestDto: CreateCompleteQuestDto,
    @Req() req: Request,
  ) {
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

    // Grab our cool pet contract
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

    const selection: QuestSelection | undefined =
      await getRepository<QuestSelection>(QuestSelection).findOne({
        relations: ['user'],
        where: {
          user: { account: (req as any).ethAddress },
        },
      });
    if (!selection) {
      throw new NotFoundException(
        `User account ${
          (req as any).ethAddress
        } has no quests in their selection.`,
      );
    }

    const quests = JSON.parse(selection.quests);

    let index = -1;
    for (let i = 0; i < quests.length; i++) {
      if (quests[i].questId === parseInt(createCompleteQuestDto.questId)) {
        index = i;
      }
    }
    if (index === -1) {
      throw new NotFoundException(
        `User account ${(req as any).ethAddress} does not have questId ${
          createCompleteQuestDto.questId
        } in their selection.`,
      );
    }
    const quest = quests[index];

    const questIo: QuestIo | undefined = await getRepository<QuestIo>(
      QuestIo,
    ).findOne({
      where: {
        status: Status.ACTIVE,
        io_id: quest.ioId,
      },
    });
    if (!questIo) {
      throw new NotFoundException(`No QuestIo found for ioId ${quest.ioId}`);
    }

    const petRepo = getRepository<CoolcatOwner>(CoolcatOwner);
    const pet: CoolcatOwner | undefined = await petRepo.findOne({
      token_id: parseInt(createCompleteQuestDto.petTokenId),
      blockchainContract: coolPetContract,
    });
    if (!pet) {
      throw new BadRequestException(
        `Pet with ID: ${createCompleteQuestDto.petTokenId} does not exist. 1`,
      );
    }
    // Make sure logged in user owns it
    if (pet.to.toLowerCase() !== (req as any).ethAddress.toLowerCase()) {
      throw new BadRequestException(
        `Pet ID: ${createCompleteQuestDto.petTokenId} is not owned by ${
          (req as any).ethAddress
        }`,
      );
    }

    let element: Element;
    // Get pet element
    const coolpetRepo = getRepository<Coolpets>(Coolpets);
    const coolpet: Coolpets | undefined = await coolpetRepo.findOne({
      where: {
        token_id: parseInt(createCompleteQuestDto.petTokenId),
      },
      relations: ['quest_history'],
    });
    if (!coolpet) {
      throw new BadRequestException(
        `Pet with ID: ${createCompleteQuestDto.petTokenId} does not exist. 2`,
      );
    }
    if (!coolpet.element) {
      element = Element.NONE;
    } else {
      switch (coolpet.element) {
        case 'fire':
          element = Element.FIRE;
          break;
        case 'grass':
          element = Element.GRASS;
          break;
        case 'air':
          element = Element.AIR;
          break;
        case 'water':
          element = Element.WATER;
          break;
        default:
          element = Element.NONE;
          break;
      }
    }

    const rewardBonus =
      quest.element !== Element.NONE && element == quest.element;

    let idsAsArray: string[] = createCompleteQuestDto.itemIds.split(',');
    if (idsAsArray.length === 1 && idsAsArray[0].length === 0) {
      idsAsArray = [];
    }
    if (idsAsArray.length != questIo.item_requirement) {
      throw new BadRequestException(
        `Not enough items sent by user to complete quest.`,
      );
    }
    if (idsAsArray.length > 0) {
      const invalidItemIds: string[] = idsAsArray.filter((val: string) => {
        const intVal: number = parseInt(val);
        return isNaN(intVal);
      });
      if (invalidItemIds.length > 0) {
        throw new BadRequestException(
          `Invalid item ids: ${invalidItemIds.join()}`,
        );
      }

      // counts becomes an object with properties keyed by the itemID with
      // a value of the count of that item ID found in the idsAsArray array.
      const counts = {};
      idsAsArray.forEach(function (x) {
        counts[x] = (counts[x] || 0) + 1;
      });
      for (const [key, value] of Object.entries(counts)) {
        const itemCount: number = await Util.getItemCount(
          (req as any).ethAddress,
          parseInt(key),
        );
        if (value > itemCount) {
          throw new BadRequestException(
            `Send quantity of item(s) #${key} to list of ${value} exceeds quantity of items held ${itemCount} by user ${
              (req as any).ethAddress
            }`,
          );
        }
      }
    }

    let questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();

    // Grab reset time
    let resetTime: number | string = await Util.redisGet(
      ERedisKey.QUEST_RESET_TIME,
    );
    if (!resetTime) {
      questWeb3ContractInstance = await Util.resolveQuestWeb3Contract();
      resetTime = parseInt(
        await questWeb3ContractInstance.methods.getDailyResetTime().call(),
      ) as number;
      await Util.redisSet(
        ERedisKey.QUEST_RESET_TIME,
        resetTime.toString(),
        60_000,
      );
    } else {
      resetTime = parseInt(resetTime);
    }

    const questsRemaining =
      await Util.getQuestsRemainingForPetInDailyResetPeriod(coolpet.token_id);

    if (!questsRemaining && questsRemaining != 0) {
      throw new NotFoundException(
        `Could not load quests remaining for pet #${coolpet.token_id}.`,
      );
    }
    if (questsRemaining === 0) {
      throw new BadRequestException(
        `Pet #${coolpet.token_id} has reached their daily quest limit.`,
      );
    }

    const stakedPet: StakedPet = await getRepository<StakedPet>(
      StakedPet,
    ).findOne({
      where: {
        token_id: coolpet.token_id,
      },
    });
    if (stakedPet) {
      if (stakedPet.staked) {
        throw new BadRequestException(
          `Pet with token ID ${coolpet.token_id} is currently staked so cannot quest`,
        );
      } else {
        if (
          Date.parse(stakedPet.timestamp) / 1000 >=
          (resetTime as number) - 86400
        ) {
          throw new BadRequestException(
            `Pet with token ID ${coolpet.token_id} cannot quest in the same day is was unstaked.`,
          );
        }
      }
    }

    // -----------------------------------------------------------
    // IF WE GET HERE, THE USER HAS QUESTS IN THEIR SELECTION, AND
    // WE HAVE IDENTIFIED THE INDEX OF THE QUEST THEY WISH TO GO ON
    // -----------------------------------------------------------

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'COMPLETE_QUEST',
        guid,
        user: (req as any).ethAddress,
        index,
        petTokenId: parseInt(createCompleteQuestDto.petTokenId),
        chosenItems: idsAsArray,
        rewardBonus,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `CompleteQuest`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all completeQuest`;
  }

  findOne(id: number) {
    return `This action returns a #${id} completeQuest`;
  }

  update(id: number, updateCompleteQuestDto: UpdateCompleteQuestDto) {
    return `This action updates a #${id} completeQuest`;
  }

  remove(id: number) {
    return `This action removes a #${id} completeQuest`;
  }
}
