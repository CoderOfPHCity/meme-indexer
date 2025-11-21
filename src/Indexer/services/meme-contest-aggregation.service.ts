// src/contest/services/aggregation/meme-contest-aggregation.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationParams } from '../../blockchain/interfaces/blockchain.interface';

@Injectable()
export class MemeContestAggregationService {
  private readonly logger = new Logger(MemeContestAggregationService.name);
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 20;

  constructor(private readonly prisma: PrismaService) {}

  async getContests(
    filters: { state?: number; creator?: string },
    pagination: PaginationParams = {},
  ) {
    const { page = this.DEFAULT_PAGE, limit = this.DEFAULT_LIMIT } = pagination;
    const skip = (page - 1) * limit;

    try {
      const where: any = {};
      if (filters.state !== undefined) where.state = filters.state;
      if (filters.creator) where.creator = filters.creator.toLowerCase();

      const [contests, total] = await this.prisma.$transaction([
        this.prisma.contest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            _count: {
              select: { proposals: true, votes: true },
            },
          },
        }),
        this.prisma.contest.count({ where }),
      ]);

      return {
        contests: contests.map((contest) => ({
          ...contest,
          contestId: contest.contestId.toString(),
          contestStart: contest.contestStart.toString(),
          votingPeriod: contest.votingPeriod.toString(),
          votingDelay: contest.votingDelay.toString(),
          blockNumber: contest.blockNumber.toString(),
          proposalCount: contest._count.proposals,
          voteCount: contest._count.votes,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching contests', error);
      throw new Error(`Failed to fetch contests: ${error.message}`);
    }
  }

  async getContestDetails(address: string) {
    try {
      const contest = await this.prisma.contest.findUnique({
        where: { address: address.toLowerCase() },
        include: {
          _count: {
            select: { proposals: true, votes: true },
          },
        },
      });

      if (!contest) {
        throw new NotFoundException(`Contest not found: ${address}`);
      }

      return {
        ...contest,
        contestId: contest.contestId.toString(),
        contestStart: contest.contestStart.toString(),
        votingPeriod: contest.votingPeriod.toString(),
        votingDelay: contest.votingDelay.toString(),
        blockNumber: contest.blockNumber.toString(),
        proposalCount: contest._count.proposals,
        voteCount: contest._count.votes,
      };
    } catch (error) {
      this.logger.error(`Error fetching contest ${address}`, error);
      throw error;
    }
  }

  async getProposals(
    contestAddress: string,
    sortBy: 'votes' | 'recent' = 'votes',
    pagination: PaginationParams = {},
  ) {
    const { page = this.DEFAULT_PAGE, limit = this.DEFAULT_LIMIT } = pagination;
    const skip = (page - 1) * limit;

    try {
      const orderBy =
        sortBy === 'votes'
          ? { totalVotes: 'desc' as const }
          : { createdAt: 'desc' as const };

      const [proposals, total] = await this.prisma.$transaction([
        this.prisma.proposal.findMany({
          where: { contestAddress: contestAddress.toLowerCase() },
          orderBy,
          skip,
          take: limit,
          include: {
            _count: {
              select: { votes: true },
            },
          },
        }),
        this.prisma.proposal.count({
          where: { contestAddress: contestAddress.toLowerCase() },
        }),
      ]);

      return {
        proposals: proposals.map((proposal) => ({
          ...proposal,
          blockNumber: proposal.blockNumber.toString(),
          voteCount: proposal._count.votes,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching proposals', error);
      throw new Error(`Failed to fetch proposals: ${error.message}`);
    }
  }

  async getLeaderboard(contestAddress: string, limit: number = 10) {
    try {
      const topProposals = await this.prisma.proposal.findMany({
        where: { contestAddress: contestAddress.toLowerCase() },
        orderBy: { totalVotes: 'desc' },
        take: limit,
        select: {
          proposalId: true,
          author: true,
          description: true,
          totalVotes: true,
          contentHash: true,
        },
      });

      return topProposals.map((proposal, index) => ({
        rank: index + 1,
        ...proposal,
      }));
    } catch (error) {
      this.logger.error('Error fetching leaderboard', error);
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }
  }

  async getContestStats(contestAddress: string) {
    try {
      const [contest, voteStats] = await this.prisma.$transaction([
        this.prisma.contest.findUnique({
          where: { address: contestAddress.toLowerCase() },
          include: {
            _count: {
              select: { proposals: true, votes: true },
            },
          },
        }),
        this.prisma.vote.groupBy({
          by: ['voter'],
          where: { contestAddress: contestAddress.toLowerCase() },
          _count: { voter: true },
          orderBy: {
            _count: {
              voter: 'desc',
            },
          },
        }),
      ]);

      if (!contest) {
        throw new NotFoundException(`Contest not found: ${contestAddress}`);
      }

      return {
        totalProposals: contest._count.proposals,
        totalVotes: contest.totalVotes,
        totalVoteTransactions: contest._count.votes,
        uniqueVoters: voteStats.length,
        contestState: contest.state,
      };
    } catch (error) {
      this.logger.error('Error fetching contest stats', error);
      throw error;
    }
  }

  async getVotes(
    contestAddress: string,
    filters: { proposalId?: string; voter?: string },
    pagination: PaginationParams = {},
  ) {
    const { page = this.DEFAULT_PAGE, limit = this.DEFAULT_LIMIT } = pagination;
    const skip = (page - 1) * limit;

    try {
      const where: any = { contestAddress: contestAddress.toLowerCase() };
      if (filters.proposalId) where.proposalId = filters.proposalId;
      if (filters.voter) where.voter = filters.voter.toLowerCase();

      const [votes, total] = await this.prisma.$transaction([
        this.prisma.vote.findMany({
          where,
          orderBy: { votedAt: 'desc' },
          skip,
          take: limit,
          include: {
            proposal: {
              select: {
                description: true,
                author: true,
              },
            },
          },
        }),
        this.prisma.vote.count({ where }),
      ]);

      return {
        votes: votes.map((vote) => ({
          ...vote,
          blockNumber: vote.blockNumber.toString(),
          votedAt: vote.votedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching votes', error);
      throw new Error(`Failed to fetch votes: ${error.message}`);
    }
  }

  async getProposalDetails(proposalId: string, contestAddress: string) {
    try {
      const proposal = await this.prisma.proposal.findUnique({
        where: {
          proposalId_contestAddress: {
            proposalId,
            contestAddress: contestAddress.toLowerCase(),
          },
        },
        include: {
          votes: {
            orderBy: { votedAt: 'desc' },
            take: 10,
            select: {
              voter: true,
              numVotes: true,
              cost: true,
              votedAt: true,
            },
          },
          _count: {
            select: { votes: true },
          },
        },
      });

      if (!proposal) {
        throw new NotFoundException(`Proposal not found: ${proposalId}`);
      }

      return {
        ...proposal,
        blockNumber: proposal.blockNumber.toString(),
        voteCount: proposal._count.votes,
        recentVotes: proposal.votes.map((v) => ({
          ...v,
          votedAt: v.votedAt.toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error('Error fetching proposal details', error);
      throw error;
    }
  }

  async getUserActivity(userAddress: string) {
    try {
      const [contestsCreated, proposalsSubmitted, votesCast] =
        await this.prisma.$transaction([
          this.prisma.contest.count({
            where: { creator: userAddress.toLowerCase() },
          }),
          this.prisma.proposal.count({
            where: { author: userAddress.toLowerCase() },
          }),
          this.prisma.vote.count({
            where: { voter: userAddress.toLowerCase() },
          }),
        ]);

      const [recentProposals, recentVotes] = await this.prisma.$transaction([
        this.prisma.proposal.findMany({
          where: { author: userAddress.toLowerCase() },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            proposalId: true,
            contestAddress: true,
            description: true,
            totalVotes: true,
            createdAt: true,
          },
        }),
        this.prisma.vote.findMany({
          where: { voter: userAddress.toLowerCase() },
          orderBy: { votedAt: 'desc' },
          take: 5,
          include: {
            proposal: {
              select: {
                description: true,
                contestAddress: true,
              },
            },
          },
        }),
      ]);

      return {
        contestsCreated,
        proposalsSubmitted,
        votesCast,
        recentProposals: recentProposals.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        })),
        recentVotes: recentVotes.map((v) => ({
          ...v,
          votedAt: v.votedAt.toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error('Error fetching user activity', error);
      throw new Error(`Failed to fetch user activity: ${error.message}`);
    }
  }
}
