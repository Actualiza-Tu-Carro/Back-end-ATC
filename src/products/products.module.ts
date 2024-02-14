import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './entities/product.entity';
import { Categories } from 'src/categories/entities/category.entity';
import { Brand } from 'src/brands/entities/brand.entity';
import { AdminProductsModule } from 'src/admin-products/admin-products.module';
import { ShoppingCartModule } from 'src/shopping-cart/shopping-cart.module';
import { UserProductFav } from 'src/orders/entities/userProductFav.entity';
import { FavProduct } from 'src/orders/entities/favProduct.entity';
import { BrandsModule } from 'src/brands/brands.module';
import { Image } from './entities/image.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Product,
      Categories,
      Brand,
      UserProductFav,
      FavProduct,
      Image,
    ]),
    forwardRef(() => AdminProductsModule),
    forwardRef(() => ShoppingCartModule),
    forwardRef(() => BrandsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
