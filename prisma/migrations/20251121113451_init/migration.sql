-- CreateTable
CREATE TABLE "contests" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contestId" BIGINT NOT NULL,
    "creator" TEXT NOT NULL,
    "contest_start" BIGINT NOT NULL,
    "voting_period" BIGINT NOT NULL,
    "voting_delay" BIGINT NOT NULL,
    "state" INTEGER NOT NULL DEFAULT 0,
    "cost_to_propose" TEXT NOT NULL,
    "cost_to_vote" TEXT NOT NULL,
    "total_proposals" INTEGER NOT NULL DEFAULT 0,
    "totalVotes" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "transaction_hash" TEXT NOT NULL,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "contest_address" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "total_votes" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "contest_address" TEXT NOT NULL,
    "voter" TEXT NOT NULL,
    "num_votes" TEXT NOT NULL,
    "cost" TEXT NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "block_number" BIGINT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "log_index" INTEGER NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_state" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contests_address_key" ON "contests"("address");

-- CreateIndex
CREATE INDEX "contests_state_created_at_idx" ON "contests"("state", "created_at");

-- CreateIndex
CREATE INDEX "contests_creator_idx" ON "contests"("creator");

-- CreateIndex
CREATE INDEX "contests_created_at_idx" ON "contests"("created_at");

-- CreateIndex
CREATE INDEX "proposals_contest_address_total_votes_idx" ON "proposals"("contest_address", "total_votes" DESC);

-- CreateIndex
CREATE INDEX "proposals_author_idx" ON "proposals"("author");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_proposal_id_contest_address_key" ON "proposals"("proposal_id", "contest_address");

-- CreateIndex
CREATE INDEX "votes_proposal_id_idx" ON "votes"("proposal_id");

-- CreateIndex
CREATE INDEX "votes_contest_address_idx" ON "votes"("contest_address");

-- CreateIndex
CREATE INDEX "votes_voter_idx" ON "votes"("voter");

-- CreateIndex
CREATE INDEX "votes_voted_at_idx" ON "votes"("voted_at");

-- CreateIndex
CREATE UNIQUE INDEX "votes_transaction_hash_log_index_key" ON "votes"("transaction_hash", "log_index");

-- CreateIndex
CREATE UNIQUE INDEX "sync_state_key_key" ON "sync_state"("key");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_contest_address_fkey" FOREIGN KEY ("contest_address") REFERENCES "contests"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_contest_address_fkey" FOREIGN KEY ("contest_address") REFERENCES "contests"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_proposal_id_contest_address_fkey" FOREIGN KEY ("proposal_id", "contest_address") REFERENCES "proposals"("proposal_id", "contest_address") ON DELETE CASCADE ON UPDATE CASCADE;
