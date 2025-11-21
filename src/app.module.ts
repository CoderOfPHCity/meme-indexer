import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainModule } from './blockchain/blockchain.module';
import { MemeContestIndexerService } from './Indexer/services/meme-contest-indexer.service';
import { MemeContestMonitorService } from './blockchain/services/memeContestMonitorService';
import { BlockchainService } from './blockchain/services/blockchain.service';
import { PrismaModule } from '../prisma/prisma.module'; 
import { RedisModule } from './redis/redis.module';
import { MemeContestController } from './Indexer/controllers/meme-contest.controller'; 
import { MemeContestAggregationService } from './Indexer/services/meme-contest-aggregation.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BlockchainModule,
    PrismaModule, 
    RedisModule,
  ],
  controllers: [AppController, MemeContestController],
  providers: [
    AppService,
    MemeContestIndexerService,
    MemeContestAggregationService, 
    {
      provide: MemeContestMonitorService,
      useFactory: (blockchainService: BlockchainService) => {
        const factoryAddress = process.env.FACTORY_ADDRESS;
        if (!factoryAddress) {
          throw new Error('FACTORY_ADDRESS environment variable is required');
        }

        return new MemeContestMonitorService(
          blockchainService,
          process.env.CHAIN_ID || '84532',
          [
            {
              address: factoryAddress,
              isFactory: true,
            },
          ],
        );
      },
      inject: [BlockchainService],
    },
  ],
})
export class AppModule {}
