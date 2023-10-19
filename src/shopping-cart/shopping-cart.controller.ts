import { Controller, Get, Patch, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ShoppingCartService } from './shopping-cart.service';
import { GetUser } from '../auth/auth-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guarg';
import { UserChangePasswordDto } from '../auth/dto/user-change-password.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Shopping cart')
@Controller('shopping-cart')
export class ShoppingCartController {
  constructor(private readonly shoppingCartService: ShoppingCartService) {}

  @ApiOperation({ summary: 'Agregar producto al carrito' })
  @Post()
  async postProductoInShoppingCart(
  @Body() data: { productId: string; cartId: string; amount: number },
  ) {
    const postThisProduct = await this.shoppingCartService.postProductInCart(
      data.productId,
      data.cartId,
      data.amount,
    );
    return postThisProduct;
  }

  @ApiOperation({ summary: 'Eliminar un producto del carrito' })
  @ApiResponse({
    status: 204,
    description: 'Producto eliminado exitosamente',
  })
  @ApiResponse({ status: 500, description: 'Error del servidor' })
  @ApiResponse({
    status: 404,
    description: 'No se encontró el registro de CartProduct',
  })
  @Delete(':cartId/:productId')
  async remove(
  @Param('cartId') cartId: string,
    @Param('productId') productId: string,
  ) {
    const response = await this.shoppingCartService.remove(cartId, productId);
    return response;
  }

  @ApiOperation({ summary: 'Obtener un carrito por id' })
  @Get(':cartId') // Cambiar el parámetro a cartId
  async getCartProducts(@Param('cartId') cartId: string) { // Cambiar el nombre del parámetro a cartId
    const thisShoppingCart = await this.shoppingCartService.getCartProducts(
      cartId, // Pasar el cartId como parámetro
    );
    return thisShoppingCart;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCart(
  @GetUser() { userId }: UserChangePasswordDto,
  ) {
    const cart = await this.shoppingCartService.getCart(userId);
    return cart;
  }

  @Patch()
  async updateProductQuantity(@Body() updateInfo: { cartProductId: string; newQuantity: number }) {
    const response = await this.shoppingCartService.updateProductQuantity(updateInfo);
    return response;
  }
}