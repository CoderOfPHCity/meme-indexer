import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { MemeContestMonitorService } from '../../blockchain/services/memeContestMonitorService';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../.././redis/redis.service';
import {
  ContestEvent,
  ProposalEvent,
  VoteEvent,
} from '../../blockchain/interfaces/blockchain.interface';
import { REDIS_KEYS } from '.././config/constants';
import { parseUnits } from 'ethers';

@Injectable()
export class MemeContestIndexerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MemeContestIndexerService.name);
  private readonly BATCH_SIZE = 1000;

  constructor(
    private readonly monitorService: MemeContestMonitorService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Contest Indexer Service Started');
    await this.initializeIndexing();
  }

  private async initializeIndexing() {
    try {
      const currentBlock = await this.monitorService.getLatestBlockNumber();

      const lastIndexedBlock = await this.redis.get(
        REDIS_KEYS.LAST_INDEXED_BLOCK,
      );

      // Start real-time subscriptions
      this.initializeEventSubscriptions();

      // Handle historical sync if needed
      if (lastIndexedBlock) {
        const lastBlock = parseInt(lastIndexedBlock);
        if (lastBlock < currentBlock) {
          this.logger.log(
            `Starting historical indexing from block ${lastBlock} to ${currentBlock}`,
          );
          this.startHistoricalIndexing(lastBlock, currentBlock);
        }
      } else {
        await this.redis.set(
          REDIS_KEYS.LAST_INDEXED_BLOCK,
          currentBlock.toString(),
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize indexing', error);
      throw error;
    }
  }

  private async startHistoricalIndexing(fromBlock: number, toBlock: number) {
    try {
      for (let start = fromBlock; start < toBlock; start += this.BATCH_SIZE) {
        const end = Math.min(start + this.BATCH_SIZE, toBlock);

        await this.indexHistoricalEvents(start, end);
        await this.redis.set(REDIS_KEYS.LAST_INDEXED_BLOCK, end.toString());

        this.logger.log(`Indexed historical blocks ${start} to ${end}`);
      }
      this.logger.log('Historical indexing completed');
    } catch (error) {
      this.logger.error('Error during historical indexing', error);
      // Don't throw - let the service continue with real-time monitoring
    }
  }

  private initializeEventSubscriptions() {
    // Subscribe to contest creations
    this.monitorService.subscribeToContestCreations(async (event) => {
      this.logger.log(`🎯 NEW CONTEST: ${event.contestAddress}`);
      this.logger.log(`   Creator: ${event.creator}`);
      this.logger.log(`   TX: ${event.transactionHash}`);
      await this.indexContestCreated(event);
    });

    this.logger.log('Initialized event subscriptions');
  }

  private async indexContestCreated(event: ContestEvent) {
    this.logger.log(`✅ Contest indexed successfully`);
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await this.prisma.$transaction(async (prisma) => {
          // Create contest record
          await prisma.contest.upsert({
            where: { address: event.contestAddress },
            create: {
              address: event.contestAddress,
              contestId: BigInt(event.contestId),
              creator: event.creator,
              contestStart: BigInt(event.contestStart),
              votingPeriod: BigInt(event.votingPeriod),
              votingDelay: BigInt(0),
              state: 0, // Queued
              costToPropose: '0',
              costToVote: '0',
              blockNumber: BigInt(event.blockNumber),
              transactionHash: event.transactionHash,
            },
            update: {},
          });

          // Subscribe to this new contest's events
          await this.subscribeToContestEvents(event.contestAddress);

          // Update last indexed block
          const blockNumber = Number(event.blockNumber);
          const lastIndexedBlock = await this.redis.get(
            REDIS_KEYS.LAST_INDEXED_BLOCK,
          );
          const currentLastBlock = lastIndexedBlock
            ? parseInt(lastIndexedBlock)
            : 0;

          if (blockNumber > currentLastBlock) {
            await this.redis.set(
              REDIS_KEYS.LAST_INDEXED_BLOCK,
              blockNumber.toString(),
            );
            this.logger.debug(`Updated last indexed block to ${blockNumber}`);
          }
        });

        this.logger.log(`Indexed contest created: ${event.contestAddress}`);
        break;
      } catch (error) {
        // Handle deadlock
        if (error.code === '40P01' && retryCount < maxRetries - 1) {
          retryCount++;
          this.logger.warn(
            `Deadlock detected for contest ${event.contestAddress}, retry attempt ${retryCount}`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
          continue;
        }
        this.logger.error(
          `Failed to index contest after ${retryCount} retries: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }
  }

  private async subscribeToContestEvents(contestAddress: string) {
    try {
      this.monitorService.addContestContract(contestAddress);
      // Subscribe to proposals
      this.monitorService.subscribeToProposals(
        contestAddress,
        async (event) => {
          await this.indexProposal(event);
        },
      );

      // Subscribe to votes
      this.monitorService.subscribeToVotes(contestAddress, async (event) => {
        await this.indexVote(event);
      });
    } catch (error) {
      this.logger.warn(
        `Could not subscribe to contest ${contestAddress}: ${error.message}`,
      );
    }
  }

  private async indexProposal(event: ProposalEvent) {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await this.prisma.$transaction(async (prisma) => {
          // Fetch full proposal details from contract
          const proposalDetails = await this.monitorService.getProposalDetails(
            event.contestAddress,
            event.proposalId,
          );

          // Create proposal record
          await prisma.proposal.upsert({
            where: {
              proposalId_contestAddress: {
                proposalId: event.proposalId,
                contestAddress: event.contestAddress,
              },
            },
            create: {
              proposalId: event.proposalId,
              contestAddress: event.contestAddress,
              author: event.author,
              description: event.description,
              contentHash: proposalDetails.contentHash || '',
              totalVotes: proposalDetails.totalVotes,
              blockNumber: BigInt(event.blockNumber),
              transactionHash: event.transactionHash,
              logIndex: event.logIndex,
            },
            update: {},
          });

          // Increment contest total proposals
          await prisma.contest.update({
            where: { address: event.contestAddress },
            data: {
              totalProposals: { increment: 1 },
              updatedAt: new Date(),
            },
          });

          // Update last indexed block
          const blockNumber = Number(event.blockNumber);
          const lastIndexedBlock = await this.redis.get(
            REDIS_KEYS.LAST_INDEXED_BLOCK,
          );
          const currentLastBlock = lastIndexedBlock
            ? parseInt(lastIndexedBlock)
            : 0;

          if (blockNumber > currentLastBlock) {
            await this.redis.set(
              REDIS_KEYS.LAST_INDEXED_BLOCK,
              blockNumber.toString(),
            );
          }
        });

        this.logger.log(
          `Indexed proposal: ${event.proposalId} in contest ${event.contestAddress}`,
        );
        break;
      } catch (error) {
        if (error.code === '40P01' && retryCount < maxRetries - 1) {
          retryCount++;
          this.logger.warn(
            `Deadlock detected for proposal ${event.proposalId}, retry attempt ${retryCount}`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
          continue;
        }
        this.logger.error(
          `Failed to index proposal after ${retryCount} retries: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }
  }

  private async indexVote(event: VoteEvent) {
    const maxRetries = 3;
    let retryCount = 0;

    console.log('  event.cost:', event.cost, 'type:', typeof event.cost);
    console.log('  event.votes:', event.votes, 'type:', typeof event.votes);
    console.log('  event.proposalId:', event.proposalId);

    while (retryCount < maxRetries) {
      try {
        await this.prisma.$transaction(async (prisma) => {
          // Create vote record
          await prisma.vote.upsert({
            where: {
              transactionHash_logIndex: {
                transactionHash: event.transactionHash,
                logIndex: event.logIndex,
              },
            },
            create: {
              proposalId: event.proposalId,
              contestAddress: event.contestAddress,
              voter: event.voter,
              numVotes: event.votes.toString(),
              cost: (parseFloat(event.cost) / 1e18).toFixed(0),
              votedAt: new Date(event.timestamp * 1000),
              blockNumber: BigInt(event.blockNumber),
              transactionHash: event.transactionHash,
              logIndex: event.logIndex,
            },
            update: {},
          });

          // Update proposal total votes
          await prisma.proposal.updateMany({
            where: {
              proposalId: event.proposalId,
              contestAddress: event.contestAddress,
            },
            data: {
              totalVotes: { increment: BigInt(event.votes) },

              updatedAt: new Date(),
            },
          });

          // Update contest aggregated stats
          await prisma.contest.update({
            where: { address: event.contestAddress },
            data: {
              totalVotes: { increment: BigInt(event.votes) },
              updatedAt: new Date(),
            },
          });

          // Update last indexed block
          const blockNumber = Number(event.blockNumber);
          const lastIndexedBlock = await this.redis.get(
            REDIS_KEYS.LAST_INDEXED_BLOCK,
          );
          const currentLastBlock = lastIndexedBlock
            ? parseInt(lastIndexedBlock)
            : 0;

          if (blockNumber > currentLastBlock) {
            await this.redis.set(
              REDIS_KEYS.LAST_INDEXED_BLOCK,
              blockNumber.toString(),
            );
            this.logger.debug(`Updated last indexed block to ${blockNumber}`);
          }
        });

        this.logger.log(
          `Indexed vote: ${event.voter} -> proposal ${event.proposalId}`,
        );
        break;
      } catch (error) {
        if (error.code === '40P01' && retryCount < maxRetries - 1) {
          retryCount++;
          this.logger.warn(
            `Deadlock detected for vote ${event.transactionHash}, retry attempt ${retryCount}`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
          continue;
        }
        this.logger.error(
          `Failed to index vote after ${retryCount} retries: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }
  }

  async indexHistoricalEvents(fromBlock: number, toBlock: number) {
    try {
      // Index contest creations
      const contests = await this.monitorService.getContestCreations(
        fromBlock,
        toBlock,
      );
      for (const contest of contests) {
        await this.indexContestCreated(contest);
      }

      // Get all contest addresses from DB
      const existingContests = await this.prisma.contest.findMany({
        select: { address: true },
      });

      // Index proposals and votes for each contest
      for (const contest of existingContests) {
        try {
          this.monitorService.addContestContract(contest.address);

          const [proposals, votes] = await Promise.all([
            this.monitorService.getProposals(
              contest.address,
              fromBlock,
              toBlock,
            ),
            this.monitorService.getVotes(contest.address, fromBlock, toBlock),
          ]);

          for (const proposal of proposals) {
            await this.indexProposal(proposal);
          }

          for (const vote of votes) {
            await this.indexVote(vote);
          }
        } catch (error) {
          // Log but continue with other contests
          this.logger.warn(
            `Could not index historical data for contest ${contest.address}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Indexed historical events from block ${fromBlock} to ${toBlock}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to index historical events: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    // Unsubscribe from all contests
    const contests = await this.prisma.contest.findMany({
      select: { address: true },
    });

    for (const contest of contests) {
      this.monitorService.unsubscribeFromContest(contest.address);
    }

    this.logger.log('Cleaned up event subscriptions');
  }
}
