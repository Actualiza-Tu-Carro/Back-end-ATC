import { Injectable, BadRequestException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { IResponse } from 'src/utils/interfaces/response.interface';
import { SendMailDto } from './dto/sendMail.dto';
import { Cases } from './dto/sendMail.dto';
import { Templates } from './templates/templates_enum';
@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  //Si no hay un contexto, simplemente pon '{}'
  async sendMails(sendMailDto: SendMailDto): Promise<IResponse> {
    const { addressee, subject, context } = sendMailDto;
    try {
      let mail;
      switch (subject) {
        case Cases.RESET_PASSWORD:
          mail = await this.mailerService.sendMail({
            to: addressee,
            subject: 'Se ha solicitado recuperar la contraseña de tu cuenta en ATC.',
            template: Templates.recoverPassword,
            context: context,
          });
          break;
        case Cases.CREATE_ACCOUNT:
          mail = await this.mailerService.sendMail({
            to: addressee,
            subject: 'Nueva cuenta registrada con éxito.',
            template: Templates.createAccount,
            context: context,
          });
          break;
        case Cases.PURCHASE:
          mail = await this.mailerService.sendMail({
            to: addressee,
            subject: 'Nueva Compra',
            template: Templates.purchase,
            context: context,
          });
          break;
          
      }
      //If mail.accepted: [ user_email ]
      if (mail.accepted.length) return { statusCode: 200, message: 'El link para recuperar la contraseña ha sido enviado' };
      // if mail.rejected: [ user_email ]
      if (mail.rejected.length) throw new InternalServerErrorException('Error al enviar el correo de recuperación');
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
    

  }
}
