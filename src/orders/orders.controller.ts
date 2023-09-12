import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { IOrder } from './interfaces/response-order.interface';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  //Obtener una orden por id
  @ApiOperation({ summary: 'Obtener orden' })
  @ApiResponse({
    status: 200,
    description: 'Orden obtenida',
  })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  @ApiResponse({ status: 500, description: 'Error del servidor' })
  @ApiParam({
    name: 'id',
    description: 'id de la orden que busco',
    type: 'string',
  })
  @Get(':id')
  async findOneOrder(@Param('id') id: string):Promise<IOrder> {
    const response = await this.ordersService.findOneOrder(id);
    return response;
  }

  //Obtener órdenes por usuario
  @Get('user-orders/:id')
  async findAlByUser(@Param('id') id:string):Promise<IOrder> {
    const response = await this.ordersService.findAllByUser(id);
    return response;
  }

  @Post()
  create(@Body() total: number, @Body() userId: string, @Body() productsId: string[] ) {
    return this.ordersService.create(total, userId, productsId);
  }
}
