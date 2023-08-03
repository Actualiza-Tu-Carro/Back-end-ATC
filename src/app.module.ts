import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as dotenv from 'dotenv'
import { SequelizeModule } from '@nestjs/sequelize';
import { DireetionsModule } from './directions/directions.module';
dotenv.config()

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DBHOST,
      port: Number(process.env.DBPORT),
      username: process.env.DBUSERNAME,
      password: process.env.DBPASSWORD,
      database: process.env.DBDATABASE,
      models: [],
      autoLoadModels: true,
      synchronize: true,
    }),
    DireetionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
