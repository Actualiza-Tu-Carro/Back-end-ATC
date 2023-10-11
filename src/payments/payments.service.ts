import * as mercadopago from 'mercadopago';
import { ACCESS_TOKEN } from 'src/config/env';
import { Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { Payment, PaymentState } from './entities/payment.entity';
import { Order, OrderStateEnum } from 'src/orders/entities/order.entity';
import { CreatePreferencePayload } from 'mercadopago/models/preferences/create-payload.model';
import { UsersService } from '../users/users.service'; // Importa el servicio de usuarios
import { MailService } from '../mail/mail.service'; // Importa el servicio de correo
import { Cases } from 'src/mail/dto/sendMail.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { IPurchaseContext } from '../mail/interfaces/purchase-context.interface';
import { Product } from 'src/products/entities/product.entity';

mercadopago.configurations.setAccessToken(ACCESS_TOKEN);

@Injectable()
export class PaymentsService {
  constructor(
    private readonly mailsService: MailService,
  ) {
    mercadopago.configure({
      access_token: process.env.ACCESS_TOKEN,
    });
  }

  async createPayment(amount: number,  userId: string, orderId?: string) {
    try {
      const user = await User.findByPk(userId);
      // Crea un objeto de preferencia con los detalles del pago
      const preference: CreatePreferencePayload = {
        items: [
          {
            title: 'Descripción del producto',
            quantity: 1,
            currency_id: 'COP', // Moneda (Asegúrate de usar la moneda correcta)
            unit_price: amount, // Monto del pago
          },
        ],
        payer: {
          name: user.firstName,
          email: user.email, // Correo del comprador
        },
        back_urls: {
          success: `http://localhost:3000/payments/success/${orderId}`,
          failure: `http://localhost:3000/payments/failure/${orderId}`,
          pending: `http://localhost:3000/payments/pending/${orderId}`,
        },
        notification_url: `https://430b-2802-8010-8200-ee00-b58b-b516-5a1e-f60.ngrok-free.app/payments/webhook/${orderId}`,
      };
      // Crea la preferencia en Mercado Pago
      const response = await mercadopago.preferences.create(preference);
      // Guardamos los datos del pago en la base de datos
      await Payment.create({
        id: response.body.id,
        orderId,
        user_email: user.email,
        amount,
        state: PaymentState.PENDING,
      });

      // Devuelve la URL de pago generada
      return {
        url: response.body.init_point,
        paymentId: response.body.id,
      };
    } catch (error) {
      console.error('Error al crear el pago:', error);
      throw error;
    }
  }

  async actualizePayment(state: string, orderId: string) {
    const order = await Order.findByPk(orderId);

    state == 'success' ? order.state = OrderStateEnum.PAGO :
      state == 'pending' ? order.state = OrderStateEnum.PENDIENTE :
        order.state = OrderStateEnum.RECHAZADO;

    await order.save();


    const payment = await Payment.findOne({ where: { orderId } });
    state == 'success' ? payment.state = PaymentState.SUCCESS :
      state == 'pending' ? payment.state = PaymentState.PENDING :
        payment.state = PaymentState.FAILED;
    await payment.save();

    if (state == 'success') {}
    return `El estado de la orden es:${state}`;
  }

  async actualizeOrder(paymentid: number, orderId: string) {
    try {
      const payment = await mercadopago.payment.findById(paymentid);

      const status = payment.body.status;

      if (status == 'rejected') await this.actualizePayment('failure', orderId);
      if (status == 'in_process') await this.actualizePayment('pending', orderId);
      if (status == 'approved') {
        const order = await Order.findByPk(orderId);
        const user = await User.findByPk(order.userId);

        const products = await Product.findAll({
          include: [
            {
              model: Order,
              where: { id: order.id },
              through: { attributes: ['amount', 'price'] },
            },
          ],
        });

        const context: IPurchaseContext = {
          name: user.firstName,
          products: products.map(({ title, price }) => {
            return {
              productName: title,
              price,
            };
          }),
          total: payment.body.transaction_details.total_paid_amount,
          purchaseDate: order.createdAt, // Fecha de creación de la orden
        };

        const mailData = {
          addressee: user.email,
          subject: Cases.PURCHASE,
          context: context,
        };

        await this.mailsService.sendMails(mailData);
        await this.actualizePayment('success', orderId);
      }
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }
}
