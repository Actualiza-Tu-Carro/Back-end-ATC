import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  HttpException,
  HttpStatus,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { Product, stateproduct } from '../products/entities/product.entity';
import { IError } from '../utils/interfaces/error.interface';
import { CartProduct } from './entities/cart-product.entity';
import { ShoppingCart } from './entities/shopping-cart.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Transaction } from 'sequelize';

@Injectable()
export class ShoppingCartService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
  ) {}

  public async createCartProduct(userId: string) {
    try {
      const newCartUser = await ShoppingCart.create({ userId });
      return newCartUser;
    } catch (error) {
      switch (error.constructor) {
        default:
          throw new InternalServerErrorException(
            'Ocurrio un error en el servidor. No se pudo crear el carrito de compras a la hora de realizar la creación de su nuevo carrito. intente más tarde.',
          );
      }
    }
  }

  async postProductInCart(
    productId: string,
    cartId: string,
    amount: number,
  ): Promise<{ statusCode: number; message: string }> {
    console.log(productId, cartId, amount);
    const thisProduct: boolean | IError = await this.getThisProduct(
      productId,
      amount,
    );

    const thisShoppingCart: boolean | IError = await this.getThisShoppingCart(
      cartId,
    );

    if (thisProduct === true && thisShoppingCart === true) {
      await CartProduct.create({
        amount,
        productId,
        cartId,
      });
      return {
        statusCode: 200,
        message: 'Producto agregado con exito!',
      };
    }
  }

  private async getThisShoppingCart(id: string): Promise<boolean | IError> {
    try {
      const thisCart = await ShoppingCart.findByPk(id);
      if (!thisCart)
        throw new NotFoundException(
          'No se ha encontrado el Carrito solicitado.',
        );
      return true;
    } catch (error) {
      switch (error.constructor) {
        case NotFoundException:
          throw new NotFoundException(error.message);
        default:
          throw new InternalServerErrorException(
            "Ocurrio un error en el servidor a la hora de consultar el 'Carrito de compras'.",
          );
      }
    }
  }

  private async getThisProduct(
    id: string,
    cantidad: number,
  ): Promise<boolean | IError> {
    try {
      const thisProducto = await Product.findByPk(id, {
        attributes: ['id', 'state', 'stock', 'price'],
      });
      if (!thisProducto)
        throw new NotFoundException(
          'No se encontró el producto entre nuestro catalogo de disponibles.',
        );
      if (thisProducto.state === stateproduct.Inactive)
        throw new NotFoundException(
          'El producto seleccionado no se encuentra disponible para la venta. Consulte en otro momento.',
        );
      if (thisProducto.stock < cantidad)
        throw new BadRequestException(
          'La cantidad de productos solicitados sobrepasa el Stock disponible en la tienda.',
        );

      return true;
    } catch (error) {
      switch (error.constructor) {
        case NotFoundException:
          throw new NotFoundException(error.message);
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException(
            'Ocurrio un error en el servidor al tratar de buscar un producto',
          );
      }
    }
  }

  async remove(cartId: string, productId: string) {
    try {
      const cartProductToDelete = await CartProduct.findOne({
        where: {
          cartId: cartId,
          productId: productId,
        },
      });

      if (cartProductToDelete) {
        await cartProductToDelete.destroy();

        return {
          statusCode: 204,
          message: 'Producto eliminado exitosamente',
        };
      } else {
        throw new NotFoundException(
          'No se encontró el registro de CartProduct',
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException('Error del servidor');
      }
    }
  }

  public async CreateShoppingCart(
    userId: { userId: string },
    transaction: Transaction,
  ): Promise<void> {
    await ShoppingCart.create(userId, { transaction });
    return;
  }

  public async destroyShoppingCart(
    userId: { userId: string },
    transaction: Transaction,
  ): Promise<void> {
    await ShoppingCart.destroy({
      where: userId,
      force: true,
      transaction,
    });
    return;
  }

  async getCart(userId: string) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: ShoppingCart,
          },
        ],
      });
      const cart = await ShoppingCart.findByPk(user.cart.dataValues.id, {
        include: [
          {
            model: Product,
            attributes: ['id', 'title', 'price'],
          },
        ],
      });

      const products = await Promise.all(
        cart.products?.map(async (product) => {
          const cartProduct = await CartProduct.findOne({
            where: {
              cartId: cart.id,
              productId: product.id,
            },
          });

          const subtotal = product.price * cartProduct.amount;

          return {
            id: product.id,
            title: product.title,
            price: product.price,
            amount: cartProduct.amount,
            subtotal, // Agregar el subtotal para este producto
          };
        }),
      );

      const total = products.reduce(
        (acc, product) => acc + product.subtotal,
        0,
      );

      return {
        id: cart.id,
        products,
        total,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getCartProducts(cartId: string) {
    try {
      const thisCart = await ShoppingCart.findByPk(cartId, {
        include: [{ model: Product, attributes: ['id', 'title', 'price'] }],
      });

      if (!thisCart) {
        throw new NotFoundException('No se encontró el carrito de compras.');
      }

      const products = await Promise.all(
        thisCart.products?.map(async (product) => {
          const cartProduct = await CartProduct.findOne({
            where: {
              cartId: thisCart.id,
              productId: product.id,
            },
          });

          const subtotal = product.price * cartProduct.amount;

          return {
            id: product.id,
            title: product.title,
            price: product.price,
            amount: cartProduct.amount,
            subtotal, // Agregar el subtotal para este producto
          };
        }),
      );

      const total = products.reduce(
        (acc, product) => acc + product.subtotal,
        0,
      );

      return {
        id: thisCart.id,
        products,
        total,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'Error del servidor al obtener el carrito de compras.',
        );
      }
    }
  }

  async updateProductQuantity(updateInfo: {
    cartProductId: string;
    newQuantity: number;
  }): Promise<{ statusCode: number; message: string }> {
    try {
      const cartProductToUpdate = await CartProduct.findByPk(
        updateInfo.cartProductId,
      );

      if (!cartProductToUpdate) {
        throw new NotFoundException(
          'No se encontró el registro de CartProduct',
        );
      }

      const thisProduct: boolean | IError = await this.getThisProduct(
        cartProductToUpdate.productId, // Usar el productId de la tabla intermedia
        updateInfo.newQuantity,
      );

      if (thisProduct === true) {
        cartProductToUpdate.amount = updateInfo.newQuantity;
        await cartProductToUpdate.save();

        return {
          statusCode: 200,
          message: 'Cantidad de producto actualizada con éxito!',
        };
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'Error del servidor al actualizar la cantidad de producto.',
        );
      }
    }
  }
}
