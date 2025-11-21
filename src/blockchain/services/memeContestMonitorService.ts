import { Injectable, Logger } from '@nestjs/common';
import { Contract, ethers, WebSocketProvider } from 'ethers';
import { BlockchainService } from './blockchain.service';
import {
  ContestConfig,
  ContestEvent,
  ProposalEvent,
  VoteEvent,
} from '../interfaces/blockchain.interface';
import { FACTORY_ABI } from 'src/Indexer/config/constants';
import { WebSocket } from 'ws';

@Injectable()
export class MemeContestMonitorService {
  protected readonly logger = new Logger(this.constructor.name);
  protected provider: WebSocketProvider;
  //private readonly chainId = process.env.CHAIN_ID || '84532';
  protected readonly factoryAddress = process.env.FACTORY_ADDRESS;
  //private readonly contestContracts = process.env.CONTRACT_ADDRESSES
  protected factoryContract: Contract;
  protected contestContracts: Map<string, Contract> = new Map();
  protected readonly BATCH_SIZE = 2000;

  protected readonly CONTEST_CREATED_TOPIC = ethers.id(
    'ContestCreated(address,address,uint256,uint256,uint256)',
  );
  protected readonly PROPOSAL_CREATED_TOPIC = ethers.id(
    'ProposalCreated(uint256,address,string)',
  );
  protected readonly VOTE_CAST_TOPIC = ethers.id(
    'VoteCast(address,uint256,uint256,uint256)',
  );

  // protected readonly FACTORY_ABI = [
  //   {
  //     type: 'constructor',
  //     inputs: [
  //       { name: '_implementation', type: 'address', internalType: 'address' },
  //       {
  //         name: '_labsSplitDestination',
  //         type: 'address',
  //         internalType: 'address',
  //       },
  //       { name: '_owner', type: 'address', internalType: 'address' },
  //     ],
  //     stateMutability: 'nonpayable',
  //   },
  //   {
  //     type: 'function',
  //     name: 'acceptOwnership',
  //     inputs: [],
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //   },
  //   {
  //     type: 'function',
  //     name: 'allContests',
  //     inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  //     outputs: [{ name: '', type: 'address', internalType: 'address' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'contestCount',
  //     inputs: [],
  //     outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'contestInfo',
  //     inputs: [{ name: '', type: 'address', internalType: 'address' }],
  //     outputs: [
  //       { name: 'contestAddress', type: 'address', internalType: 'address' },
  //       { name: 'creator', type: 'address', internalType: 'address' },
  //       { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
  //       { name: 'exists', type: 'bool', internalType: 'bool' },
  //     ],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'createContest',
  //     inputs: [
  //       {
  //         name: 'config',
  //         type: 'tuple',
  //         internalType: 'struct MemeContestFactory.ContestConfig',
  //         components: [
  //           { name: 'contestStart', type: 'uint256', internalType: 'uint256' },
  //           { name: 'votingDelay', type: 'uint256', internalType: 'uint256' },
  //           { name: 'votingPeriod', type: 'uint256', internalType: 'uint256' },
  //           {
  //             name: 'numAllowedProposalSubmissions',
  //             type: 'uint256',
  //             internalType: 'uint256',
  //           },
  //           {
  //             name: 'maxProposalCount',
  //             type: 'uint256',
  //             internalType: 'uint256',
  //           },
  //           {
  //             name: 'percentageToCreator',
  //             type: 'uint256',
  //             internalType: 'uint256',
  //           },
  //           { name: 'costToPropose', type: 'uint256', internalType: 'uint256' },
  //           { name: 'costToVote', type: 'uint256', internalType: 'uint256' },
  //           {
  //             name: 'priceCurveType',
  //             type: 'uint256',
  //             internalType: 'uint256',
  //           },
  //           { name: 'multiple', type: 'uint256', internalType: 'uint256' },
  //           {
  //             name: 'creatorSplitDestination',
  //             type: 'address',
  //             internalType: 'address',
  //           },
  //         ],
  //       },
  //       { name: 'salt', type: 'bytes32', internalType: 'bytes32' },
  //     ],
  //     outputs: [
  //       { name: 'contestAddress', type: 'address', internalType: 'address' },
  //     ],
  //     stateMutability: 'nonpayable',
  //   },
  //   {
  //     type: 'function',
  //     name: 'creatorContests',
  //     inputs: [
  //       { name: '', type: 'address', internalType: 'address' },
  //       { name: '', type: 'uint256', internalType: 'uint256' },
  //     ],
  //     outputs: [{ name: '', type: 'address', internalType: 'address' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'getContestInfo',
  //     inputs: [
  //       { name: 'contestAddress', type: 'address', internalType: 'address' },
  //     ],
  //     outputs: [
  //       {
  //         name: '',
  //         type: 'tuple',
  //         internalType: 'struct MemeContestFactory.ContestInfo',
  //         components: [
  //           {
  //             name: 'contestAddress',
  //             type: 'address',
  //             internalType: 'address',
  //           },
  //           { name: 'creator', type: 'address', internalType: 'address' },
  //           { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
  //           { name: 'exists', type: 'bool', internalType: 'bool' },
  //         ],
  //       },
  //     ],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'getContests',
  //     inputs: [
  //       { name: 'offset', type: 'uint256', internalType: 'uint256' },
  //       { name: 'limit', type: 'uint256', internalType: 'uint256' },
  //     ],
  //     outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'getCreatorContests',
  //     inputs: [{ name: 'creator', type: 'address', internalType: 'address' }],
  //     outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'getTotalContests',
  //     inputs: [],
  //     outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'implementation',
  //     inputs: [],
  //     outputs: [{ name: '', type: 'address', internalType: 'address' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'labsSplitDestination',
  //     inputs: [],
  //     outputs: [{ name: '', type: 'address', internalType: 'address' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'multicall',
  //     inputs: [
  //       { name: 'contests', type: 'address[]', internalType: 'address[]' },
  //       { name: 'data', type: 'bytes', internalType: 'bytes' },
  //     ],
  //     outputs: [{ name: 'results', type: 'bytes[]', internalType: 'bytes[]' }],
  //     stateMutability: 'nonpayable',
  //   },
  //   {
  //     type: 'function',
  //     name: 'owner',
  //     inputs: [],
  //     outputs: [{ name: '', type: 'address', internalType: 'address' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'pendingOwner',
  //     inputs: [],
  //     outputs: [{ name: '', type: 'address', internalType: 'address' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'predictContestAddress',
  //     inputs: [{ name: 'salt', type: 'bytes32', internalType: 'bytes32' }],
  //     outputs: [{ name: '', type: 'address', internalType: 'address' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'function',
  //     name: 'renounceOwnership',
  //     inputs: [],
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //   },
  //   {
  //     type: 'function',
  //     name: 'setImplementation',
  //     inputs: [
  //       { name: 'newImplementation', type: 'address', internalType: 'address' },
  //     ],
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //   },
  //   {
  //     type: 'function',
  //     name: 'setlabsSplitDestination',
  //     inputs: [
  //       { name: 'newDestination', type: 'address', internalType: 'address' },
  //     ],
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //   },
  //   {
  //     type: 'function',
  //     name: 'transferOwnership',
  //     inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
  //     outputs: [],
  //     stateMutability: 'nonpayable',
  //   },
  //   {
  //     type: 'function',
  //     name: 'usedSalt',
  //     inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
  //     outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
  //     stateMutability: 'view',
  //   },
  //   {
  //     type: 'event',
  //     name: 'ContestCreated',
  //     inputs: [
  //       {
  //         name: 'creator',
  //         type: 'address',
  //         indexed: true,
  //         internalType: 'address',
  //       },
  //       {
  //         name: 'contestAddress',
  //         type: 'address',
  //         indexed: true,
  //         internalType: 'address',
  //       },
  //       {
  //         name: 'contestId',
  //         type: 'uint256',
  //         indexed: true,
  //         internalType: 'uint256',
  //       },
  //       {
  //         name: 'contestStart',
  //         type: 'uint256',
  //         indexed: false,
  //         internalType: 'uint256',
  //       },
  //       {
  //         name: 'votingPeriod',
  //         type: 'uint256',
  //         indexed: false,
  //         internalType: 'uint256',
  //       },
  //     ],
  //     anonymous: false,
  //   },
  //   {
  //     type: 'event',
  //     name: 'ImplementationUpdated',
  //     inputs: [
  //       {
  //         name: 'oldImplementation',
  //         type: 'address',
  //         indexed: true,
  //         internalType: 'address',
  //       },
  //       {
  //         name: 'newImplementation',
  //         type: 'address',
  //         indexed: true,
  //         internalType: 'address',
  //       },
  //     ],
  //     anonymous: false,
  //   },
  //   {
  //     type: 'event',
  //     name: 'OwnershipTransferStarted',
  //     inputs: [
  //       {
  //         name: 'previousOwner',
  //         type: 'address',
  //         indexed: true,
  //         internalType: 'address',
  //       },
  //       {
  //         name: 'newOwner',
  //         type: 'address',
  //         indexed: true,
  //         internalType: 'address',
  //       },
  //     ],
  //     anonymous: false,
  //   },
  //   {
  //     type: 'event',
  //     name: 'OwnershipTransferred',
  //     inputs: [
  //       {
  //         name: 'previousOwner',
  //         type: 'address',
  //         indexed: true,
  //         internalType: 'address',
  //       },
  //       {
  //         name: 'newOwner',
  //         type: 'address',
  //         indexed: true,
  //         internalType: 'address',
  //       },
  //     ],
  //     anonymous: false,
  //   },
  //   {
  //     type: 'error',
  //     name: 'AddressEmptyCode',
  //     inputs: [{ name: 'target', type: 'address', internalType: 'address' }],
  //   },
  //   { type: 'error', name: 'ContestDoesNotExist', inputs: [] },
  //   { type: 'error', name: 'FailedCall', inputs: [] },
  //   { type: 'error', name: 'FailedDeployment', inputs: [] },
  //   {
  //     type: 'error',
  //     name: 'InsufficientBalance',
  //     inputs: [
  //       { name: 'balance', type: 'uint256', internalType: 'uint256' },
  //       { name: 'needed', type: 'uint256', internalType: 'uint256' },
  //     ],
  //   },
  //   { type: 'error', name: 'InvalidImplementation', inputs: [] },
  //   { type: 'error', name: 'InvalidPercentage', inputs: [] },
  //   { type: 'error', name: 'InvalidTimestamps', inputs: [] },
  //   {
  //     type: 'error',
  //     name: 'OwnableInvalidOwner',
  //     inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
  //   },
  //   {
  //     type: 'error',
  //     name: 'OwnableUnauthorizedAccount',
  //     inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
  //   },
  //   { type: 'error', name: 'SaltAlreadyUsed', inputs: [] },
  // ];

  protected readonly CONTEST_ABI = [
    'function propose(string, string) external payable returns (uint256)',
    'function castVote(uint256, uint256) external payable',
    'function contestStart() external view returns (uint256)',
    'function voteStart() external view returns (uint256)',
    'function votingPeriod() external view returns (uint256)',
    'function proposals(uint256) external view returns (address, string, string, uint256, bool)',
    'function votes(uint256, address) external view returns (uint256)',
    'event ProposalCreated(uint256 indexed proposalId, address indexed author, string description)',
    'event VoteCast(address indexed voter, uint256 indexed proposalId, uint256 votes, uint256 cost)',
  ];

  constructor(
    protected readonly blockchainService: BlockchainService,
    protected readonly chainId: string,
    protected readonly contestConfigs: ContestConfig[],
  ) {
    this.initializeProvider();
  }

  protected async initializeProvider() {
    const rpcUrl = this.blockchainService.getRpcUrl(this.chainId);

    if (!rpcUrl) {
      throw new Error(`RPC URL not found for chain ${this.chainId}`);
    }

    const wsUrl = rpcUrl.replace('https', 'wss').replace('http', 'ws');
    this.provider = new WebSocketProvider(wsUrl);

    (this.provider.websocket as WebSocket).on('close', async () => {
      console.log('WebSocket disconnected, reconnecting...');
      await this.initializeProvider();
    });

    for (const config of this.contestConfigs) {
      if (config.isFactory) {
        this.factoryContract = this.blockchainService.createContract(
          this.factoryAddress || config.address,
          FACTORY_ABI,
          this.provider,
        );
      } else {
        const contract = this.blockchainService.createContract(
          config.address,
          this.CONTEST_ABI,
          this.provider,
        );
        this.contestContracts.set(config.address, contract);
      }
    }
  }

  async getContestCreations(
    fromBlock: number,
    toBlock: number,
  ): Promise<ContestEvent[]> {
    try {
      const allEvents: ContestEvent[] = [];

      for (
        let currentBlock = fromBlock;
        currentBlock <= toBlock;
        currentBlock += this.BATCH_SIZE
      ) {
        const batchToBlock = Math.min(
          currentBlock + this.BATCH_SIZE - 1,
          toBlock,
        );

        const filter = {
          address: this.factoryContract.target as string,
          fromBlock: currentBlock,
          toBlock: batchToBlock,
          topics: [this.CONTEST_CREATED_TOPIC],
        };

        const logs = await this.blockchainService.getLogs(
          this.provider,
          filter,
        );
        const batchEvents = await Promise.all(
          logs.map(async (log) => {
            const parsedLog = this.factoryContract.interface.parseLog(log);
            if (!parsedLog) {
              this.logger.warn(
                `Skipping unparsable log from transaction ${log.transactionHash}`,
              );
              return null;
            }
            const block = await this.blockchainService.getBlock(
              this.provider,
              log.blockNumber,
            );
            if (!block) {
              this.logger.warn(
                `Could not fetch block ${log.blockNumber}. Skipping event.`,
              );
              return null;
            }

            return {
              creator: parsedLog.args.creator,
              contestAddress: parsedLog.args.contestAddress,
              contestId: parsedLog.args.contestId.toString(),
              contestStart: parsedLog.args.contestStart.toString(),
              votingPeriod: parsedLog.args.votingPeriod.toString(),
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              logIndex: log.index,
              timestamp: block.timestamp,
            };
          }),
        ).then((results) => results.filter((item) => item !== null));

        allEvents.push(...batchEvents);
        this.logger.log(
          `Processed blocks ${currentBlock} to ${batchToBlock} for contest creations`,
        );
      }

      return allEvents;
    } catch (error) {
      this.logger.error('Error fetching contest creations', error);
      throw new Error(`Failed to fetch contest creations: ${error.message}`);
    }
  }

  async getProposals(
    contestAddress: string,
    fromBlock: number,
    toBlock: number,
  ): Promise<ProposalEvent[]> {
    try {
      const contract = this.contestContracts.get(contestAddress);
      if (!contract) {
        throw new Error(
          `No contract found for contest address ${contestAddress}`,
        );
      }

      const allProposals: ProposalEvent[] = [];

      for (
        let currentBlock = fromBlock;
        currentBlock <= toBlock;
        currentBlock += this.BATCH_SIZE
      ) {
        const batchToBlock = Math.min(
          currentBlock + this.BATCH_SIZE - 1,
          toBlock,
        );

        const filter = {
          address: contestAddress,
          fromBlock: currentBlock,
          toBlock: batchToBlock,
          topics: [this.PROPOSAL_CREATED_TOPIC],
        };

        const logs = await this.blockchainService.getLogs(
          this.provider,
          filter,
        );
        const batchProposals = await Promise.all(
          logs.map(async (log) => {
            const parsedLog = contract.interface.parseLog(log);
            if (!parsedLog) {
              this.logger.warn(
                `Skipping unparsable log from transaction ${log.transactionHash}`,
              );
              return null;
            }

            const block = await this.blockchainService.getBlock(
              this.provider,
              log.blockNumber,
            );
            if (!block) {
              this.logger.warn(
                `Could not fetch block ${log.blockNumber}. Skipping event.`,
              );
              return null;
            }

            return {
              contestAddress,
              proposalId: parsedLog.args.proposalId.toString(),
              author: parsedLog.args.author,
              description: parsedLog.args.description,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              logIndex: log.index,
              timestamp: block.timestamp,
            };
          }),
        ).then((results) => results.filter((item) => item !== null));

        allProposals.push(...batchProposals);
        this.logger.log(
          `Processed blocks ${currentBlock} to ${batchToBlock} for contest ${contestAddress}`,
        );
      }

      return allProposals;
    } catch (error) {
      this.logger.error('Error fetching proposals', error);
      throw new Error(`Failed to fetch proposals: ${error.message}`);
    }
  }

  async getVotes(
    contestAddress: string,
    fromBlock: number,
    toBlock: number,
  ): Promise<VoteEvent[]> {
    try {
      const contract = this.contestContracts.get(contestAddress);
      if (!contract) {
        throw new Error(
          `No contract found for contest address ${contestAddress}`,
        );
      }

      const allVotes: VoteEvent[] = [];

      for (
        let currentBlock = fromBlock;
        currentBlock <= toBlock;
        currentBlock += this.BATCH_SIZE
      ) {
        const batchToBlock = Math.min(
          currentBlock + this.BATCH_SIZE - 1,
          toBlock,
        );

        const filter = {
          address: contestAddress,
          fromBlock: currentBlock,
          toBlock: batchToBlock,
          topics: [this.VOTE_CAST_TOPIC],
        };

        const logs = await this.blockchainService.getLogs(
          this.provider,
          filter,
        );
        const batchVotes = await Promise.all(
          logs.map(async (log) => {
            const parsedLog = contract.interface.parseLog(log);

            if (!parsedLog) {
              this.logger.warn(
                `Skipping unparsable log from transaction ${log.transactionHash}`,
              );
              return null;
            }
            const block = await this.blockchainService.getBlock(
              this.provider,
              log.blockNumber,
            );
            if (!block) {
              this.logger.warn(
                `Could not fetch block ${log.blockNumber}. Skipping event.`,
              );
              return null;
            }

            return {
              contestAddress,
              voter: parsedLog.args.voter,
              proposalId: parsedLog.args.proposalId.toString(),
              votes: ethers.formatEther(parsedLog.args.votes),
              cost: ethers.formatEther(parsedLog.args.cost),
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              logIndex: log.index,
              timestamp: block.timestamp,
            };
          }),
        ).then((results) => results.filter((item) => item !== null));

        allVotes.push(...batchVotes);
        this.logger.log(
          `Processed blocks ${currentBlock} to ${batchToBlock} for votes in ${contestAddress}`,
        );
      }

      return allVotes;
    } catch (error) {
      this.logger.error('Error fetching votes', error);
      throw new Error(`Failed to fetch votes: ${error.message}`);
    }
  }

  subscribeToContestCreations(callback: (event: ContestEvent) => void): void {
    this.factoryContract.on(
      'ContestCreated',
      async (
        creator,
        contestAddress,
        contestId,
        contestStart,
        votingPeriod,
        event,
      ) => {
        const maxRetries = 2;
        let attempt = 0;

        while (attempt < maxRetries) {
          try {
            const block = await event.getBlock();
            const contestEvent: ContestEvent = {
              creator,
              contestAddress,
              contestId: contestId.toString(),
              contestStart: contestStart.toString(),
              votingPeriod: votingPeriod.toString(),
              blockNumber: event.log.blockNumber,
              logIndex: event.log.index,
              transactionHash: event.log.transactionHash,
              timestamp: block.timestamp,
            };
            callback(contestEvent);
            break;
          } catch (error) {
            if (error.message?.includes('cannot query unfinalized data')) {
              attempt++;
              if (attempt === maxRetries) {
                this.logger.error(
                  `Failed to get block data after ${maxRetries} retries`,
                  error,
                );
                throw error;
              }
              const delay = Math.pow(2, attempt) * 1000;
              this.logger.warn(
                `Block not finalized yet, retrying in ${delay}ms`,
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
              throw error;
            }
          }
        }
      },
    );
    this.logger.log(`Subscribed to contest creation events`);
  }

  subscribeToProposals(
    contestAddress: string,
    callback: (event: ProposalEvent) => void,
  ): void {
    const contract = this.contestContracts.get(contestAddress);
    if (!contract) {
      throw new Error(
        `No contract found for contest address ${contestAddress}`,
      );
    }

    contract.on(
      'ProposalCreated',
      async (proposalId, author, description, event) => {
        this.logger.log(
          `📝 ProposalCreated event detected for ${contestAddress}: ${proposalId}`,
        );
        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
          try {
            const block = await event.getBlock();
            const proposalEvent: ProposalEvent = {
              contestAddress,
              proposalId: proposalId.toString(),
              author,
              description,
              blockNumber: event.log.blockNumber,
              logIndex: event.log.index,
              transactionHash: event.log.transactionHash,
              timestamp: block.timestamp,
            };
            callback(proposalEvent);
            break;
          } catch (error) {
            if (error.message?.includes('cannot query unfinalized data')) {
              attempt++;
              if (attempt === maxRetries) {
                this.logger.error(
                  `Failed to get block data after ${maxRetries} retries`,
                  error,
                );
                throw error;
              }
              const delay = Math.pow(2, attempt) * 1000;
              this.logger.warn(
                `Block not finalized yet, retrying in ${delay}ms`,
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
              throw error;
            }
          }
        }
      },
    );
    this.logger.log(
      `Subscribed to proposal events for contest ${contestAddress}`,
    );
  }

  subscribeToVotes(
    contestAddress: string,
    callback: (event: VoteEvent) => void,
  ): void {
    const contract = this.contestContracts.get(contestAddress);
    if (!contract) {
      throw new Error(
        `No contract found for contest address ${contestAddress}`,
      );
    }

    contract.on('VoteCast', async (voter, proposalId, votes, cost, event) => {
      const maxRetries = 3;
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          const block = await event.getBlock();
          const voteEvent: VoteEvent = {
            contestAddress,
            voter,
            proposalId: proposalId.toString(),
            votes: ethers.formatEther(votes),
            cost: ethers.formatEther(cost),
            blockNumber: event.log.blockNumber,
            logIndex: event.log.index,
            transactionHash: event.log.transactionHash,
            timestamp: block.timestamp,
          };
          callback(voteEvent);
          break;
        } catch (error) {
          if (error.message?.includes('cannot query unfinalized data')) {
            attempt++;
            if (attempt === maxRetries) {
              this.logger.error(
                `Failed to get block data after ${maxRetries} retries`,
                error,
              );
              throw error;
            }
            const delay = Math.pow(2, attempt) * 1000;
            this.logger.warn(`Block not finalized yet, retrying in ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }
    });
    this.logger.log(`Subscribed to vote events for contest ${contestAddress}`);
  }

  unsubscribeFromContest(contestAddress: string): void {
    const contract = this.contestContracts.get(contestAddress);
    if (contract) {
      contract.removeAllListeners('ProposalCreated');
      contract.removeAllListeners('VoteCast');
      contract.removeAllListeners('ProposalsDeleted');
      contract.removeAllListeners('ContestCanceled');
      this.logger.log(`Unsubscribed from events for contest ${contestAddress}`);
    }
  }

  async getWinners(
    contestAddress: string,
    count: number,
  ): Promise<{ proposalIds: string[]; votes: string[] }> {
    try {
      const contract = this.contestContracts.get(contestAddress);
      if (!contract) {
        throw new Error(
          `No contract found for contest address ${contestAddress}`,
        );
      }
      const [ids, votes] = await contract.getWinners(count);
      return {
        proposalIds: ids.map((id) => id.toString()),
        votes: votes.map((v) => ethers.formatEther(v)),
      };
    } catch (error) {
      this.logger.error(
        `Error fetching winners for contest ${contestAddress}`,
        error,
      );
      throw new Error(`Failed to fetch winners: ${error.message}`);
    }
  }

  async getProposalDetails(
    contestAddress: string,
    proposalId: string,
  ): Promise<any> {
    try {
      const contract = this.contestContracts.get(contestAddress);
      if (!contract) {
        throw new Error(
          `No contract found for contest address ${contestAddress}`,
        );
      }
      const proposal = await contract.proposals(proposalId);
      return {
        author: proposal.author,
        description: proposal.description,
        contentHash: proposal.contentHash,
        totalVotes: proposal.totalVotes
          ? ethers.formatEther(proposal.totalVotes)
          : '0',
        exists: proposal.exists,
      };
    } catch (error) {
      this.logger.error(`Error fetching proposal ${proposalId}`, error);
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }
  }

  async monitorBlocks(
    callback: (events: {
      contests?: ContestEvent[];
      proposals?: ProposalEvent[];
      votes?: VoteEvent[];
    }) => void,
  ): Promise<void> {
    let lastProcessedBlock = await this.blockchainService.getLatestBlockNumber(
      this.provider,
    );

    this.provider.on('block', async (blockNumber: number) => {
      try {
        if (blockNumber > lastProcessedBlock) {
          const contests = await this.getContestCreations(
            lastProcessedBlock + 1,
            blockNumber,
          );

          const allProposals: ProposalEvent[] = [];
          const allVotes: VoteEvent[] = [];

          for (const [address] of this.contestContracts.entries()) {
            const proposals = await this.getProposals(
              address,
              lastProcessedBlock + 1,
              blockNumber,
            );
            const votes = await this.getVotes(
              address,
              lastProcessedBlock + 1,
              blockNumber,
            );
            allProposals.push(...proposals);
            allVotes.push(...votes);
          }

          if (
            contests.length > 0 ||
            allProposals.length > 0 ||
            allVotes.length > 0
          ) {
            callback({ contests, proposals: allProposals, votes: allVotes });
          }
          lastProcessedBlock = blockNumber;
        }
      } catch (error) {
        this.logger.error(`Error processing block ${blockNumber}`, error);
      }
    });
    this.logger.log('Started block monitoring');
  }

  addContestContract(contestAddress: string): void {
    if (!this.contestContracts.has(contestAddress)) {
      const contract = this.blockchainService.createContract(
        contestAddress,
        this.CONTEST_ABI,
        this.provider,
      );
      this.contestContracts.set(contestAddress, contract);
      this.logger.log(`✅ Added contest contract: ${contestAddress}`);
    }
  }

  async getLatestBlockNumber(): Promise<number> {
    return this.blockchainService.getLatestBlockNumber(this.provider);
  }
}
