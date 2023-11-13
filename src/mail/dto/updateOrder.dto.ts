import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { IResetPasswordContext } from '../interfaces/reset-password-context.interface';
import { ICreateUserContext } from '../interfaces/create-account-context.interface';
import { IPurchaseContext } from '../interfaces/purchase-context.interface';
import { IContactFormAdminContext } from '../interfaces/contact-form-admin-context.interface';
import { IContactFormUserContext } from '../interfaces/contact-form-user-context.interface';
import { IUpdateOrderContext } from '../interfaces/update-order-context.interface';
import { ConsultationReason } from '../interfaces/update-order-context.interface';

export enum Cases {
  RESET_PASSWORD = 'RESET_PASSWORD',
  CREATE_ACCOUNT = 'CREATE_ACCOUNT',
  PURCHASE = 'PURCHASE',
  CONTACT_FORM_ADMIN = 'CONTACT_FORM_ADMIN',
  CONTACT_FORM_USER = 'CONTACT_FORM_USER',
  UPDATE_ORDER = 'UPDATE_ORDER'
}

export class UpdateOrderDto {
    @IsString({ message: 'El campo $property debe ser un texto' })
    @IsNotEmpty({ message: 'El campo $property está vacío' })
    @ApiProperty({
      description: 'Recibe el nro de orden',
    })
    order: string;
  
    @IsString({ message: 'El campo $property debe ser un texto' })
    @IsNotEmpty({ message: 'El campo $property está vacío' })
    @ApiProperty({
      description: 'Recibe el nombre del usuario, requerido',
    })
    name: string;
  
    @IsString({ message: 'El campo $property debe ser un texto' })
    @IsNotEmpty({ message: 'El campo $property está vacío' })
    @ApiProperty({
      description: 'Recibe el telefono de contacto del usuario, requerido',
    })
    phone: string;
  
    @IsString({ message: 'El campo $property debe ser un texto' })
    @IsNotEmpty({ message: 'El campo $property está vacío' })
    @ApiProperty({
      description: 'Mensaje del usuario, requerido',
    })
    message: string;
  
    @IsEmail(undefined, { message: 'El formato del email no es valido' })
    @IsNotEmpty({ message: 'El campo $property está vacío' })
    @ApiProperty({
      description:
        'Recibe el email del usuario y verifica si es el formato adecuado. Requerido',
    })
    userEmail: string;
  
    @IsEnum(ConsultationReason, {
      message: 'El motivo de la consulta debe ser uno de: Envio, Producto, Pago, Otro',
    })
    @IsNotEmpty({ message: 'El campo $property está vacío' })
    @ApiProperty({
      description: 'Motivo de la consulta',
      enum: ['Envio', 'Producto', 'Pago', 'Otro'],
      example: 'Envio', // Proporciona un ejemplo aquí
    })
    @IsDefined({ message: 'El campo $property debe estar definido' })
    consultationReason: ConsultationReason;
  
    // Agregar la propiedad context al DTO
    context: IUpdateOrderContext;
  } 
  