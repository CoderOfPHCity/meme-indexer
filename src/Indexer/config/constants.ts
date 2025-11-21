import { EVMConfig } from '../../blockchain/interfaces/blockchain.interface';

export const AVALANCHE_CONFIG: EVMConfig = {
  rpcUrl: process.env.AVALANCHE_RPC_URL || '',
  chainId: 'avalanche',
  contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  contractABI: [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ],
  decimals: 6,
};

export const REDIS_KEYS = {
  MONITORING_STATE: 'avalanche:monitoring:state',
  LAST_INDEXED_BLOCK: 'avalanche:indexer:lastBlock',
  CATCH_UP_STATE: 'avalanche:indexer:catchingUp',
  LAST_INDEXED_BLOCK_KEY: 'avalanche:last_indexed_block',
} as const;

export const FACTORY_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_implementation', type: 'address', internalType: 'address' },
      {
        name: '_labsSplitDestination',
        type: 'address',
        internalType: 'address',
      },
      { name: '_owner', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'acceptOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allContests',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'contestCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'contestInfo',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'contestAddress', type: 'address', internalType: 'address' },
      { name: 'creator', type: 'address', internalType: 'address' },
      { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
      { name: 'exists', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createContest',
    inputs: [
      {
        name: 'config',
        type: 'tuple',
        internalType: 'struct MemeContestFactory.ContestConfig',
        components: [
          { name: 'contestStart', type: 'uint256', internalType: 'uint256' },
          { name: 'votingDelay', type: 'uint256', internalType: 'uint256' },
          { name: 'votingPeriod', type: 'uint256', internalType: 'uint256' },
          {
            name: 'numAllowedProposalSubmissions',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'maxProposalCount',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'percentageToCreator',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'costToPropose', type: 'uint256', internalType: 'uint256' },
          { name: 'costToVote', type: 'uint256', internalType: 'uint256' },
          {
            name: 'priceCurveType',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'multiple', type: 'uint256', internalType: 'uint256' },
          {
            name: 'creatorSplitDestination',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
      { name: 'salt', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [
      { name: 'contestAddress', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'creatorContests',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getContestInfo',
    inputs: [
      { name: 'contestAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct MemeContestFactory.ContestInfo',
        components: [
          {
            name: 'contestAddress',
            type: 'address',
            internalType: 'address',
          },
          { name: 'creator', type: 'address', internalType: 'address' },
          { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
          { name: 'exists', type: 'bool', internalType: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getContests',
    inputs: [
      { name: 'offset', type: 'uint256', internalType: 'uint256' },
      { name: 'limit', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getCreatorContests',
    inputs: [{ name: 'creator', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalContests',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'implementation',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'labsSplitDestination',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'multicall',
    inputs: [
      { name: 'contests', type: 'address[]', internalType: 'address[]' },
      { name: 'data', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: 'results', type: 'bytes[]', internalType: 'bytes[]' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingOwner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'predictContestAddress',
    inputs: [{ name: 'salt', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setImplementation',
    inputs: [
      { name: 'newImplementation', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setlabsSplitDestination',
    inputs: [
      { name: 'newDestination', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'usedSalt',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ContestCreated',
    inputs: [
      {
        name: 'creator',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'contestAddress',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'contestId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'contestStart',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'votingPeriod',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ImplementationUpdated',
    inputs: [
      {
        name: 'oldImplementation',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newImplementation',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnershipTransferStarted',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'AddressEmptyCode',
    inputs: [{ name: 'target', type: 'address', internalType: 'address' }],
  },
  { type: 'error', name: 'ContestDoesNotExist', inputs: [] },
  { type: 'error', name: 'FailedCall', inputs: [] },
  { type: 'error', name: 'FailedDeployment', inputs: [] },
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: [
      { name: 'balance', type: 'uint256', internalType: 'uint256' },
      { name: 'needed', type: 'uint256', internalType: 'uint256' },
    ],
  },
  { type: 'error', name: 'InvalidImplementation', inputs: [] },
  { type: 'error', name: 'InvalidPercentage', inputs: [] },
  { type: 'error', name: 'InvalidTimestamps', inputs: [] },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
  },
  { type: 'error', name: 'SaltAlreadyUsed', inputs: [] },
];
