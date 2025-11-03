// src/contest/controllers/meme-contest.controller.ts

import {
  Controller,
  Get,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MemeContestAggregationService } from '.././services/meme-contest-aggregation.service';

@ApiTags('contests')
@Controller('contests')
export class MemeContestController {
  constructor(
    private readonly aggregationService: MemeContestAggregationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all contests with filters' })
  @ApiQuery({
    name: 'state',
    type: Number,
    required: false,
    description: '0=Queued, 1=Active, 2=Completed, 3=Canceled',
  })
  @ApiQuery({ name: 'creator', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getContests(
    @Query('state') state?: string,
    @Query('creator') creator?: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ) {
    const page = rawPage ? parseInt(rawPage) : 1;
    const limit = rawLimit ? parseInt(rawLimit) : 20;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const contestState = state !== undefined ? parseInt(state) : undefined;

    const data = await this.aggregationService.getContests(
      { state: contestState, creator },
      { page, limit },
    );

    return {
      data: data?.contests,
      pagination: data?.pagination,
      message: 'Contests fetched successfully',
      status: 'success',
    };
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get contest details by address' })
  @ApiParam({
    name: 'address',
    type: String,
    description: 'Contest contract address',
  })
  async getContestDetails(@Param('address') address: string) {
    const data = await this.aggregationService.getContestDetails(address);

    return {
      data,
      message: 'Contest details fetched successfully',
      status: 'success',
    };
  }

  @Get(':address/proposals')
  @ApiOperation({ summary: 'Get proposals for a contest' })
  @ApiParam({ name: 'address', type: String })
  @ApiQuery({ name: 'sortBy', enum: ['votes', 'recent'], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getProposals(
    @Param('address') address: string,
    @Query('sortBy') sortBy: 'votes' | 'recent' = 'votes',
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ) {
    const page = rawPage ? parseInt(rawPage) : 1;
    const limit = rawLimit ? parseInt(rawLimit) : 20;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const data = await this.aggregationService.getProposals(address, sortBy, {
      page,
      limit,
    });

    return {
      data: data?.proposals,
      pagination: data?.pagination,
      message: 'Proposals fetched successfully',
      status: 'success',
    };
  }

  @Get(':address/leaderboard')
  @ApiOperation({ summary: 'Get contest leaderboard (top proposals)' })
  @ApiParam({ name: 'address', type: String })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of top proposals (default: 10)',
  })
  async getLeaderboard(
    @Param('address') address: string,
    @Query('limit') rawLimit?: string,
  ) {
    const limit = rawLimit ? parseInt(rawLimit) : 10;

    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    const data = await this.aggregationService.getLeaderboard(address, limit);

    return {
      data,
      message: 'Leaderboard fetched successfully',
      status: 'success',
    };
  }

  @Get(':address/stats')
  @ApiOperation({ summary: 'Get contest statistics' })
  @ApiParam({ name: 'address', type: String })
  async getContestStats(@Param('address') address: string) {
    const data = await this.aggregationService.getContestStats(address);

    return {
      data,
      message: 'Contest statistics fetched successfully',
      status: 'success',
    };
  }

  @Get(':address/votes')
  @ApiOperation({ summary: 'Get votes for a contest' })
  @ApiParam({ name: 'address', type: String })
  @ApiQuery({ name: 'proposalId', type: String, required: false })
  @ApiQuery({ name: 'voter', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getVotes(
    @Param('address') address: string,
    @Query('proposalId') proposalId?: string,
    @Query('voter') voter?: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ) {
    const page = rawPage ? parseInt(rawPage) : 1;
    const limit = rawLimit ? parseInt(rawLimit) : 20;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const data = await this.aggregationService.getVotes(
      address,
      { proposalId, voter },
      { page, limit },
    );

    return {
      data: data?.votes,
      pagination: data?.pagination,
      message: 'Votes fetched successfully',
      status: 'success',
    };
  }

  @Get('proposal/:proposalId')
  @ApiOperation({ summary: 'Get proposal details by ID' })
  @ApiParam({ name: 'proposalId', type: String })
  @ApiQuery({ name: 'contestAddress', type: String })
  async getProposalDetails(
    @Param('proposalId') proposalId: string,
    @Query('contestAddress') contestAddress: string,
  ) {
    if (!contestAddress) {
      throw new BadRequestException('contestAddress is required');
    }

    const data = await this.aggregationService.getProposalDetails(
      proposalId,
      contestAddress,
    );

    return {
      data,
      message: 'Proposal details fetched successfully',
      status: 'success',
    };
  }

  @Get('user/:address/activity')
  @ApiOperation({
    summary:
      'Get user activity (contests created, proposals submitted, votes cast)',
  })
  @ApiParam({
    name: 'address',
    type: String,
    description: 'User wallet address',
  })
  async getUserActivity(@Param('address') address: string) {
    const data = await this.aggregationService.getUserActivity(address);

    return {
      data,
      message: 'User activity fetched successfully',
      status: 'success',
    };
  }
}
