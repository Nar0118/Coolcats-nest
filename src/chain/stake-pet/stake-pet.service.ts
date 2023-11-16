import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreateStakePetDto } from './dto/create-stake-pet.dto';
import { UpdateStakePetDto } from './dto/update-stake-pet.dto';
import { Request } from 'express';
import { getRepository, In, IsNull, Not } from 'typeorm';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Environment } from '../../environment';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { StakedPet } from '../../entity/staked-pet';
import { Coolpets } from '../../entity/coolpets';
import { Util } from '../../util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class StakePetService {
  async create(createStakePetDto: CreateStakePetDto, @Req() req: Request) {
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

    // TODO Remove this
    // Validate our petIds parameter
    // const asArray: any[] = createStakePetDto.petIds.split(',');
    // const petIdsToStake: number[] = asArray.map((val: any) => {
    //   const asInt: number = parseInt(val);
    //   if (isNaN(asInt) || asInt < 0) {
    //     throw new BadRequestException(`petIds parameter must be an array of pet token ids`);
    //   }
    //   return asInt;
    // });

    // Validate our petIds parameter
    const petIdsToStake: number[] = Util.validateIdListParameter(
      createStakePetDto.petIds,
    );
    if (!petIdsToStake) {
      throw new BadRequestException(
        `petIds parameter must be an array of pet token ids`,
      );
    }

    // Grab our cool cats contract
    const blockchainContractRepo =
      getRepository<BlockchainContract>(BlockchainContract);
    const coolCatContract: BlockchainContract | undefined =
      await blockchainContractRepo.findOne({
        where: {
          code: 'COOLCAT_721',
          mode: Environment.env.MODE,
        },
      });
    if (!coolCatContract) {
      throw new NotFoundException('COOLCAT_721 contract not found');
    }

    // Grab our cool pets contract
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

    // First we need to get the addresses currently owned cats
    const contractRepository = getRepository<CoolcatOwner>(CoolcatOwner);
    const ownedCoolCats: CoolcatOwner[] = await contractRepository.find({
      where: {
        to: (req as any).ethAddress,
        blockchainContract: coolCatContract,
      },
    });
    if (ownedCoolCats.length === 0) {
      throw new BadRequestException(
        `User ${
          (req as any).ethAddress
        } must own at least one Cool Cat to stake pets`,
      );
    }

    // get the addresses currently owned pets in final form
    const ownedCoolPets = await contractRepository.find({
      where: {
        to: (req as any).ethAddress,
        blockchainContract: coolPetContract,
      },
    });
    if (ownedCoolPets.length === 0) {
      throw new NotFoundException(
        `User ${(req as any).ethAddress} has no pets to stake`,
      );
    }

    // Create an array of available owned pets
    const ownedPetIds: number[] = ownedCoolPets.map((val: CoolcatOwner) => {
      return val.token_id;
    });

    // Determine our pet ids that we will pass on to the blockchain
    const ownedPetIdsToStake: number[] = petIdsToStake.filter((val: number) => {
      return ownedPetIds.includes(val);
    });
    if (ownedPetIdsToStake.length === 0) {
      throw new NotFoundException(
        `None of the petIds specified are owned by user ${
          (req as any).ethAddress
        }`,
      );
    }

    // Get the pets we are about to try to stake, and make sure they are all in final form
    const ownedPetsNotInFinalForm: Coolpets[] = await getRepository<Coolpets>(
      Coolpets,
    ).find({
      where: {
        token_id: In(ownedPetIdsToStake),
        element: '',
      },
    });

    // Remove all that are not in final form from our ownedPetIdsToStake array
    ownedPetsNotInFinalForm.forEach((val: Coolpets) => {
      const loc: number = ownedPetIdsToStake.indexOf(val.token_id);
      if (loc >= 0) {
        ownedPetIdsToStake.splice(loc, 1);
      }
    });

    // See if we have any final form Pets left in our id list
    if (ownedPetIdsToStake.length === 0) {
      throw new NotFoundException(
        `None of the petIds specified by ${
          (req as any).ethAddress
        } is in final form`,
      );
    }

    // Get all already staked pets owned by the logged in user
    const stakedPets: StakedPet[] = await getRepository<StakedPet>(
      StakedPet,
    ).find({
      where: {
        token_id: In(ownedPetIdsToStake),
        staked: true,
      },
    });

    // Remove all that are already staked
    stakedPets.forEach((val: StakedPet) => {
      if (val.staked) {
        const loc: number = ownedPetIdsToStake.indexOf(val.token_id);
        if (loc >= 0) {
          ownedPetIdsToStake.splice(loc, 1);
        }
      }
    });

    // See if we have any final form Pets left in our id list
    if (ownedPetIdsToStake.length === 0) {
      throw new NotFoundException(
        `All of the petIds specified by ${
          (req as any).ethAddress
        } are already staked`,
      );
    }

    for (let i = 0; i < ownedPetIdsToStake.length; i++) {
      if (await Util.hasPetQuestedInDailyReset(ownedPetIdsToStake[i])) {
        throw new BadRequestException(
          `Pet has quested in this daily reset period, it cannot be staked.`,
        );
      }
    }

    // =======================================================================
    // If we get here, we are ready to send the contract request to claim gold
    // =======================================================================

    // Calculate our GUID to match transaction when seen on the blockchain
    const slug: string = uuidv4();
    const guid: string = ethers.utils.sha256(ethers.utils.toUtf8Bytes(slug));

    AWS.config.update({ region: Environment.env.AWS_REGION });
    const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
    const response: any = await SQS.sendMessage({
      MessageBody: JSON.stringify({
        type: 'STAKE_PET',
        guid,
        user: (req as any).ethAddress,
        tokensIds: ownedPetIdsToStake,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `StakePet`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all stakePet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stakePet`;
  }

  update(id: number, updateStakePetDto: UpdateStakePetDto) {
    return `This action updates a #${id} stakePet`;
  }

  remove(id: number) {
    return `This action removes a #${id} stakePet`;
  }
}
