// Enum of rate limiting prefixes
export enum ERateLimitPageKey {
  // Public endpoints
  CAT = 'cat-page',
  LIST_CONTRACTS = 'list-contracts-page',
  LOGIN = 'login-page',
  LOGOUT = 'logout-page',
  MARKETPLACE_CATEGORY = 'marketplace-category-page',
  PET_ACTIVITY = 'pet-activity-page',
  PET = 'pet-page',
  PRODUCT = 'product-page',

  // Auth endpoints
  IS_CONNECTED = 'is-connected-page',
  ITEM = 'item-page',
  LISTING_FEE = 'listing-fee-page',
  PURCHASE_HISTORY = 'purchase-history-page',
  MARKETPLACE = 'marketplace-page',
  NEXT_CLAIM_TIME = 'next-claim-time-page',
  QUEST_HISTORY = 'quest-history-page',
  QUEST_IO = 'quest-io-page',
  QUEST_SELECTION = 'quest-selection-page',
  QUEST_THEME = 'quest-theme-page',
  QUESTS_REMAINING = 'quests-remaining-page',
  SYNC_ITEMS = 'sync-items-page',
  SYNC_QUESTS = 'sync-quests-page',
  USER = 'user-page',
  USER_ACTIVITY = 'user-activity-page',
  USER_PROPERTY = 'user-property-page',
  WHERE_CAT = 'where-cat-page',
  WHERE_PET = 'where-pet-page',

  // Chain endpoints
  ADVENTURE_CLAIM = 'adventure-claim-page',
  BUY_BOX = 'buy-box-page',
  BUY_ACTION = 'buy-action-page',
  CALCULATE_ADVENTURE_CLAIM = 'calculate-adventure-claim-page',
  CALCULATE_MILK_CLAIM = 'calculate-milk-claim-page',
  CLAIM_GOLD = 'claim-gold-page',
  COMPLETE_QUEST = 'complete-quest-page',
  CONNECT_USER = 'connect-user-page',
  DELIST_ITEM = 'delist-item-page',
  DISCONNECT_USER = 'disconnect-user-page',
  GOLD_BALANCE = 'gold-balance-page',
  LIST_ITEM = 'list-item-page',
  OPEN_BOX = 'open-box-page',
  PET_INTERACTION = 'pet-interaction-page',
  PURCHASE_ITEM = 'purchase-item-page',
  ROLL_QUESTS = 'roll-quests-page',
  STAKE_PET = 'stake-pet-page',
  UN_STAKE_PET = 'un-stake-pet-page',

  // General
  BLOCKCHAIN = 'blockchain-page',
}

export enum ERedisKey {
  QUEST_RESET_TIME = 'quest-reset-time',
  QUEST_PET_DAY = 'quest-per-day',
  QUEST_RE_ROLL_PRICE = 'quest-re-roll-price',
  INTERACTION_RESET_TIME = 'interaction-reset-time',
  INTERACTION_PER_DAY = 'interaction-per-day',
  PET_BOX_PRICE = 'pet-box-price',
  LISTING_FEE_BASIS_POINTS = 'listing-fee-basis-points',
  SERVICE_UNAVAILABLE = 'service-unavailable',
  TEAM_WHITELIST = 'team-whitelist',
}

export enum Status {
  ACTIVE = 'active',
  DPRC = 'dprc',
}

export enum ActionStatus {
  SENT,
  FAILED,
  PROCESSING,
  COMPLETED,
}

export enum TokenType {
  NONE = '-',
  CAT = 'cat',
  PET = 'pet',
}
