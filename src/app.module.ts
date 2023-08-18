import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  DBDATABASE,
  DBHOST,
  DBPASSWORD,
  DBPORT,
  DBUSERNAME,
} from './config/env';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductsModule } from './products/products.module';
import { BrandsModule } from './brands/brands.module';
import { DireetionsModule } from './directions/directions.module';
import { CategoriesModule } from './categories/categories.module';
import { Categories } from './categories/entities/category.entity';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { Direction } from './directions/entities/direction.entity';
import { Brand } from './brands/entities/brand.entity';
import { Product } from './products/entities/product.entity';
import { AdminProductsModule } from './admin-products/admin-products.module';
import { AuthModule } from './auth/auth.module';
import { CaslModule } from './casl/casl.module';
import { ShoppingCartModule } from './shopping-cart/shopping-cart.module';
import { ShoppingCart } from './shopping-cart/entities/shopping-cart.entity';
import { CartProduct } from './shopping-cart/entities/cart-product.entity';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: DBHOST,
      port: Number(DBPORT),
      username: DBUSERNAME,
      password: DBPASSWORD,
      database: DBDATABASE,
      models: [
        Product,
        User,
        Categories,
        Direction,
        Brand,
        ShoppingCart,
        CartProduct,
      ],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
      sync: { force: false },
    }),

    ProductsModule,
    BrandsModule,
    DireetionsModule,
    CategoriesModule,
    UsersModule,
    AdminProductsModule,
    AuthModule,
    CaslModule,
    ShoppingCartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
