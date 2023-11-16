import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWherePetDto } from './dto/create-where-pet.dto';
import { UpdateWherePetDto } from './dto/update-where-pet.dto';
import { Util } from '../../util';
import { Request } from 'express';
import { getRepository, Repository } from 'typeorm';
import { CoolcatOwner } from '../../entity/coolcat-owner';
import { BlockchainContract } from '../../entity/blockchain-contract';
import { Environment } from '../../environment';
import { DatabaseService } from '../../database.service';
import { EStage, PetManagerService } from '../../pet-manager.service';

@Injectable()
export class WherePetService {
  constructor(
    private databaseService: DatabaseService,
    private petManagerService: PetManagerService,
  ) {}

  async create(createWherePetDto: CreateWherePetDto, req: Request) {
    // Make sure service is available
    //
    const serviceUnavailable: boolean = await Util.serviceUnavailable(
      (req as any).ethAddress,
    );
    if (serviceUnavailable) {
      throw new BadRequestException(
        'Service is temporarily unavailable, please try again later',
      );
    }

    // Validate and convert post parameter to integer
    const tokenId = parseInt(createWherePetDto.token_id);
    if (Number.isNaN(tokenId)) {
      throw new BadRequestException(`Invalid token_id parameter`);
    }
    if (!Number.isInteger(tokenId)) {
      throw new BadRequestException(
        `${createWherePetDto.token_id} must be an integer`,
      );
    }

    // User must be connected to call this function
    //
    if (!(await Util.isUserConnected((req as any).ethAddress))) {
      throw new BadRequestException(
        'You must connect to the system before taking this action.',
      );
    }

    // Get the pet owner from the block chain
    const petOwnerBc: string | undefined = await Util.getPetOwner(tokenId);
    if (!petOwnerBc) {
      return {
        account: (req as any).ethAddress,
        adjusted: false,
        message: `Pet ${tokenId} not found on blockchain`,
      };
    }
    if (petOwnerBc.toLowerCase() !== (req as any).ethAddress.toLowerCase()) {
      return {
        account: (req as any).ethAddress,
        adjusted: false,
        message: `Pet ${tokenId} is not owned by ${(req as any).ethAddress})`,
      };
    }

    // Grab our blockchain contract record for the Coolpet contract
    const blockchainContractRepository: Repository<BlockchainContract> =
      getRepository<BlockchainContract>(BlockchainContract);
    const blockchainContract: BlockchainContract =
      await blockchainContractRepository.findOne({
        where: {
          code: 'COOLPET_721',
          mode: Environment.env.MODE,
        },
      });

    // Grab the pet owner record from the database
    const petRepo = getRepository<CoolcatOwner>(CoolcatOwner);
    const petFromDb: CoolcatOwner = await petRepo.findOne({
      where: {
        token_id: tokenId,
        blockchainContract,
      },
    });

    console.log('75');

    // Now let's update the PET if we need to
    if (petFromDb) {
      console.log('79');
      if (petFromDb.to.toLowerCase() !== petOwnerBc.toLowerCase()) {
        // Database is not holding the correct 'to' value, so update it and save.
        console.log('82');
        petFromDb.to = petOwnerBc;
        await petRepo.save<CoolcatOwner>(petFromDb);

        return {
          account: (req as any).ethAddress,
          adjusted: true,
          message: `Pet ${tokenId} was updated to owner ${
            (req as any).ethAddress
          })`,
        };
      } else {
        console.log('92');
        return {
          account: (req as any).ethAddress,
          adjusted: false,
          message: `Pet ${tokenId} was already up to date for owner ${
            (req as any).ethAddress
          })`,
        };
      }
    } else {
      // We don't have a record in the database, so we need to create one and
      // appropriately move its metadata
      console.log('102');
      await this.petManagerService.onPetTransferEvent(
        tokenId,
        Util.BLACK_HOLE,
        petOwnerBc,
      );

      // Now get the current stage of the pet from the block chain
      const petStage: number | undefined = await Util.getPetStage(tokenId);
      if (typeof petStage !== 'undefined') {
        switch (petStage) {
          case EStage.EGG:
            console.log('110');
            // PetManagerService onPetTransferEvent(...) would have already done all the right stuff with the metadata and image
            await this.createOwnerRecord(
              blockchainContract,
              petRepo,
              tokenId,
              petOwnerBc,
            );
            break;
          case EStage.BLOB1:
            console.log('115');
            await this.petManagerService.transformPet(tokenId, EStage.BLOB1);
            await this.updateOpenSeaMetadata(tokenId);
            break;
          case EStage.BLOB2:
            console.log('120');
            await this.petManagerService.transformPet(tokenId, EStage.BLOB2);
            await this.updateOpenSeaMetadata(tokenId);
            break;
          case EStage.FINAL_FORM:
            console.log('125');
            await this.petManagerService.transformToFinalForm(tokenId);
            await this.updateOpenSeaMetadata(tokenId);
            break;
        }
        return {
          account: (req as any).ethAddress,
          adjusted: true,
        };
      } else {
        return {
          account: (req as any).ethAddress,
          adjusted: false,
          message: `Could not determine stage of Pet ${tokenId}`,
        };
      }
    }
  }

  findAll() {
    return `This action returns all wherePet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} wherePet`;
  }

  update(id: number, updateWherePetDto: UpdateWherePetDto) {
    return `This action updates a #${id} wherePet`;
  }

  remove(id: number) {
    return `This action removes a #${id} wherePet`;
  }

  /**
   * Creates an owner record for the specified token and owner address
   * @param tokenId
   * @param owner
   * @private
   */
  private async createOwnerRecord(
    blockchainContract: BlockchainContract,
    ccOwnerRepo: Repository<CoolcatOwner>,
    tokenId: number,
    owner: string,
  ): Promise<void> {
    // Find owner record (or create one)
    let ownerRecord: CoolcatOwner | undefined = await ccOwnerRepo.findOne({
      where: {
        token_id: tokenId,
        blockchainContract,
      },
    });
    if (!ownerRecord) {
      ownerRecord = new CoolcatOwner();
      (ownerRecord.token_id = tokenId), 10;
      ownerRecord.block_number = 0;
      ownerRecord.from = Util.BLACK_HOLE;
      ownerRecord.trx_hash = 'synthesized';
      ownerRecord.value = '0';
      ownerRecord.eth = 0;
      ownerRecord.timestamp = Util.mysqlFromDate(new Date());
      ownerRecord.blockchainContract = blockchainContract;
      console.log('Creating new owner record');
    } else {
      console.log('Updating existing owner record');
    }

    // Update our owner record with this latest transfer
    ownerRecord.to = owner;

    // Save our record
    await ccOwnerRepo.save<CoolcatOwner>(ownerRecord);
  }

  /**
   * Notify OpenSea that they need to update the metadata and image of a particular asset
   * @param petTokenId
   * @private
   */
  private async updateOpenSeaMetadata(petTokenId: number) {
    const blockchainContractRepo =
      getRepository<BlockchainContract>(BlockchainContract);
    const petContract: BlockchainContract | undefined =
      await blockchainContractRepo.findOne({
        where: {
          code: 'COOLPET_721',
        },
      });
    if (petContract) {
      try {
        const url = `${Environment.env.OPENSEA_ENDPOINT}api/v1/asset/${petContract.address}/${petTokenId}/?force_update=true`;
        const options = {
          method: 'GET',
          headers: { 'X-API-KEY': `${Environment.env.OPENSEA_API_KEY}` },
        };
        await fetch(url, options);
      } catch (error) {
        // We are going to eat this error, because it isn't catastrophic and is probably
        // a situation where opensea is down or something like that.
        console.log(`Could not refresh token id: ${petTokenId} at opensea`);
      }
    } else {
      throw new Error(
        'Could not find blockchainContract record for COOLPET_721',
      );
    }
  }
}
