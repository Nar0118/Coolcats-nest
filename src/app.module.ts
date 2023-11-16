/*
 * Copyright (c) 2021. Cool Cats Group LLC
 * ALL RIGHTS RESERVED
 * Author: Christopher Hassett
 */

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatModule } from './cat/cat.module';
import { ClaimGoldModule } from './chain/claim-gold/claim-gold.module';
import { LoginModule } from './login/login.module';
import { NonceModule } from './nonce/nonce.module';
import { DatabaseModule } from './database.module';
import { LogoutModule } from './logout/logout.module';
import { UserPropertyModule } from './auth/user-property/user-property.module';
import { UserModule } from './auth/user/user.module';
import { PetModule } from './pet/pet.module';
import { ConnectUserModule } from './chain/connect-user/connect-user.module';
import { DisconnectUserModule } from './chain/disconnect-user/disconnect-user.module';
import { GoldBalanceModule } from './chain/gold-balance/gold-balance.module';
import { BuyBoxModule } from './chain/buy-box/buy-box.module';
import { OpenBoxModule } from './chain/open-box/open-box.module';
import { ItemModule } from './auth/item/item.module';
import { PetInteractionModule } from './chain/pet-interaction/pet-interaction.module';
import { ListItemModule } from './chain/list-item/list-item.module';
import { DelistItemModule } from './chain/delist-item/delist-item.module';
import { PurchaseItemModule } from './chain/purchase-item/purchase-item.module';
import { MarketplaceModule } from './auth/marketplace/marketplace.module';
import { ListingFeeModule } from './auth/listing-fee/listing-fee.module';
import { MarketplaceCategoryModule } from './marketplace-category/marketplace-category.module';
import { QuestSelectionModule } from './auth/quest-selection/quest-selection.module';
import { PetActivityModule } from './pet-activity/pet-activity.module';
import { RollQuestsModule } from './chain/roll-quests/roll-quests.module';
import { CompleteQuestModule } from './chain/complete-quest/complete-quest.module';
import { QuestHistoryModule } from './auth/quest-history/quest-history.module';
import { QuestThemeModule } from './auth/quest-theme/quest-theme.module';
import { QuestIoModule } from './auth/quest-io/quest-io.module';
import { AdventureClaimModule } from './chain/adventure-claim/adventure-claim.module';
import { StakePetModule } from './chain/stake-pet/stake-pet.module';
import { UnStakePetModule } from './chain/un-stake-pet/un-stake-pet.module';
import { CalculateAdventureClaimModule } from './chain/calculate-adventure-claim/calculate-adventure-claim.module';
import { CalculateMilkClaimModule } from './chain/calculate-milk-claim/calculate-milk-claim.module';
import { UserActivityModule } from './auth/user-activity/user-activity.module';
import { ListContractsModule } from './list-contracts/list-contracts.module';
import { ProductModule } from './product/product.module';
import { SyncItemsModule } from './auth/sync-items/sync-items.module';
import { NextClaimTimeModule } from './auth/next-claim-time/next-claim-time.module';
import { WhereCatModule } from './auth/where-cat/where-cat.module';
import { WherePetModule } from './auth/where-pet/where-pet.module';
import { SyncQuestsModule } from './auth/sync-quests/sync-quests.module';
import { IsConnectedModule } from './auth/is-connected/is-connected.module';
import { QuestsRemainingModule } from './auth/quests-remaining/quests-remaining.module';
import { PetManagerModule } from './pet-manager.module';
import { BuyActionModule } from './chain/buy-action/buy-action.module';
import { PurchaseHistoryModule } from './auth/purchase-history/purchase-history.module';

@Module({
  imports: [
    CatModule,
    ClaimGoldModule,
    LoginModule,
    NonceModule,
    DatabaseModule,
    PetManagerModule,
    LogoutModule,
    UserModule,
    UserPropertyModule,
    PetModule,
    ConnectUserModule,
    DisconnectUserModule,
    GoldBalanceModule,
    BuyBoxModule,
    OpenBoxModule,
    ItemModule,
    PetInteractionModule,
    ListItemModule,
    DelistItemModule,
    PurchaseItemModule,
    MarketplaceModule,
    ListingFeeModule,
    MarketplaceCategoryModule,
    QuestSelectionModule,
    PetActivityModule,
    RollQuestsModule,
    CompleteQuestModule,
    QuestHistoryModule,
    QuestThemeModule,
    QuestIoModule,
    AdventureClaimModule,
    StakePetModule,
    UnStakePetModule,
    CalculateAdventureClaimModule,
    CalculateMilkClaimModule,
    UserActivityModule,
    ListContractsModule,
    ProductModule,
    SyncItemsModule,
    NextClaimTimeModule,
    WhereCatModule,
    WherePetModule,
    SyncQuestsModule,
    IsConnectedModule,
    QuestsRemainingModule,
    BuyActionModule,
    PurchaseHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule { }
