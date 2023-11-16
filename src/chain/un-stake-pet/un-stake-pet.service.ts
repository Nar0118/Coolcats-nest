import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreateUnStakePetDto } from './dto/create-un-stake-pet.dto';
import { UpdateUnStakePetDto } from './dto/update-un-stake-pet.dto';
import { Request } from 'express';
import { getRepository, In } from 'typeorm';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Environment } from '../../environment';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { StakedPet } from '../../entity/staked-pet';
import { Util } from '../../util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = require('aws-sdk');

@Injectable()
export class UnStakePetService {
  async create(createUnStakePetDto: CreateUnStakePetDto, @Req() req: Request) {
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

    // Validate our petIds parameter
    const asArray: any[] = createUnStakePetDto.petIds.split(',');
    const petIdsToUnstake: number[] = asArray.map((val: any) => {
      const asInt: number = parseInt(val);
      if (isNaN(asInt) || asInt < 0) {
        throw new BadRequestException(
          `petIds parameter must be an array of pet token ids`,
        );
      }
      return asInt;
    });

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

    // First we need to get the addresses currently owned pets
    const contractRepository = getRepository<CoolcatOwner>(CoolcatOwner);
    const ownedPets: CoolcatOwner[] = await contractRepository.find({
      where: {
        to: (req as any).ethAddress,
        blockchainContract: coolPetContract,
      },
    });
    if (ownedPets.length === 0) {
      throw new NotFoundException('User owns no pets');
    }

    // Create an array of available owned pets
    const ownedPetIds: number[] = ownedPets.map((val: CoolcatOwner) => {
      return val.token_id;
    });

    // Remove petIds that the user does not own
    petIdsToUnstake.forEach((val: number) => {
      const loc: number = ownedPetIds.indexOf(val);
      if (loc < 0) {
        petIdsToUnstake.splice(loc, 1);
      }
    });
    if (petIdsToUnstake.length === 0) {
      throw new NotFoundException(
        `User ${
          (req as any).ethAddress
        } does not own any of the pets specified`,
      );
    }

    // Get all already staked pets owned by the logged in user
    const ownedPetsToUnstake: StakedPet[] = await getRepository<StakedPet>(
      StakedPet,
    ).find({
      where: {
        token_id: In(petIdsToUnstake),
        staked: true,
      },
    });
    if (ownedPetsToUnstake.length === 0) {
      throw new NotFoundException(
        `User ${
          (req as any).ethAddress
        } does not have any staked pets to unstake`,
      );
    }

    // Create the IDs of the pets to unstake
    const ownedPetIdsToUnstake: number[] = ownedPetsToUnstake.map(
      (val: StakedPet) => {
        return val.token_id;
      },
    );

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
        type: 'UN_STAKE_PET',
        guid,
        user: (req as any).ethAddress,
        tokensIds: ownedPetIdsToUnstake,
      }),
      MessageDeduplicationId: `${guid}`,
      MessageGroupId: `UnStakePet`,
      QueueUrl: Environment.env.AWS_SQS_URL,
    }).promise();

    return { messageGuid: guid.substr(2) };
  }

  findAll() {
    return `This action returns all unStakePet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} unStakePet`;
  }

  update(id: number, updateUnStakePetDto: UpdateUnStakePetDto) {
    return `This action updates a #${id} unStakePet`;
  }

  remove(id: number) {
    return `This action removes a #${id} unStakePet`;
  }
}
