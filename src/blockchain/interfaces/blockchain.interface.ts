import { ethers } from 'ethers';

export interface ContestConfig {
  address: string;
  isFactory: boolean;
  symbol?: string;
}

export interface ContestEvent {
  creator: string;
  contestAddress: string;
  contestId: string;
  title: string;      
  description: string;
  contestStart: string;
  votingPeriod: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp: number;
}

export interface ProposalEvent {
  contestAddress: string;
  proposalId: string;
  author: string;
  description: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp: number;
}

export interface VoteEvent {
  contestAddress: string;
  voter: string;
  proposalId: string;
  votes: string;
  cost: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

