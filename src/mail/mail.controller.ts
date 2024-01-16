import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { IContactFormAdminContext } from './interfaces/contact-form-admin-context.interface';
import { IContactFormUserContext } from './interfaces/contact-form-user-context.interface';
import {
  ConsultationReason,
  IUpdateOrderContext,
} from './interfaces/update-order-context.interface';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { ContactFormDto } from './dto/contactForm.dto';
import { UpdateOrderDto, UpdateOrderDtoSwagger } from './dto/updateOrder.dto';
import { Cases } from 'src/mail/dto/sendMail.dto';
import { ADMIN_EMAIL } from 'src/config/env';
import { GetUser } from 'src/auth/auth-user.decorator';
import { IGetUser } from 'src/auth/interefaces/getUser.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guarg';

@ApiTags('Mail')
@Controller('contact')
export class ContactController {
  constructor(private readonly mailService: MailService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ruta para enviar solicitud de cambio en la orden',
  })
  @ApiBody({ type: UpdateOrderDtoSwagger })
  @Post('update-order')
  async sendUpdateOrderForm(
  @GetUser() { userEmail }: IGetUser,
    @Body() updateOrderData: UpdateOrderDto,
  ) {
    try {
      // Obtener el motivo de la consulta
      const consultationReason: ConsultationReason =
        updateOrderData.consultationReason;

      const orderContext: IUpdateOrderContext = {
        name: updateOrderData.name,
        phone: updateOrderData.phone,
        message: updateOrderData.message,
        userEmail,
        order: updateOrderData.order,
        consultationReason,
      };

      // Enviar correos electrónicos
      await this.mailService.sendMails({
        EmailAddress: ADMIN_EMAIL,
        subject: Cases.UPDATE_ORDER,
        context: orderContext,
      });

      // Contexto para el usuario
      const userContext = {
        firstname: updateOrderData.name,
      };

      await this.mailService.sendMails({
        EmailAddress: userEmail,
        subject: Cases.CONTACT_FORM_USER,
        context: userContext,
      });

      return {
        status: 200,
        message: 'Solicitud de cambio en la orden enviada con exito',
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @ApiOperation({
    summary: 'Ruta para contact form del front',
  })
  @ApiBody({ type: ContactFormDto })
  @Post()
  async sendContactForm(@Body() contactData: ContactFormDto) {
    try {
      const userContext: IContactFormUserContext = {
        firstname: contactData.name,
      };

      await this.mailService.sendMails({
        EmailAddress: contactData.userEmail,
        subject: Cases.CONTACT_FORM_USER,
        context: userContext,
      });

      const adminContext: IContactFormAdminContext = {
        name: contactData.name,
        phone: contactData.phone,
        message: contactData.message,
        userEmail: contactData.userEmail,
        userId: contactData.userId,
      };

      await this.mailService.sendMails({
        EmailAddress: ADMIN_EMAIL,
        subject: Cases.CONTACT_FORM_ADMIN,
        context: adminContext,
      });

      return {
        status: 200,
        message: 'Formulario de contacto enviado con éxito',
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
