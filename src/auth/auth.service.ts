import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { JWT_SECRET } from 'src/config/env';
import { Jwt } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async generatePassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  async generateToken(userId: string, userEmail: string): Promise<string> {
    const token = await this.jwtService.signAsync({
      sub: userId,
      username: userEmail,
    });
    return token;
  }

  async comparePassword(
    receivePassword: string,
    savedPassword: string,
  ): Promise<boolean> {
    const checkPassword = await bcrypt.compare(receivePassword, savedPassword);
    return checkPassword;
  }

  async recoverPassword(recoverPassword: RecoverPasswordDto): Promise<string> {
    try {
      const { email } = recoverPassword;
      const user = await this.usersService.findOneByEmail(email);

      const token = await Jwt.sign();

      //aca iria la implementacion de la creacion y el envio del
      //token y el correo con el link del formulario para cambiar la contraseña

      return 'Se ha enviado el correo de verificación con el token.';
    } catch (error) {
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException('Error interno del servidor');
      }
    }
  }

  async resetPassword(
    resetPassword: ResetPasswordDto,
    user: UserChangePasswordDto,
  ): Promise<string> {
    try {
      const { password } = resetPassword;
      const { username } = user;

      const userPass = await this.usersService.findOneByEmail(username);

      userPass.password = await this.generatePassword(password);
      userPass.save();
      return 'El cambio de la contraseña fue exitoso.';
    } catch (error) {
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException('Error interno del servidor');
      }
    }
  }

  async changePassword(
    changePassword: ChangePasswordDto,
    user: UserChangePasswordDto,
  ) {
    try {
      console.log(user);
      const { oldPassword, newPassword } = changePassword;
      const { username } = user;

      const userFind = await this.usersService.findOneByEmail(username);

      const validatePassword = await this.comparePassword(
        oldPassword,
        userFind.password,
      );

      if (validatePassword) {
        userFind.password = await this.generatePassword(newPassword);
        userFind.save();
        return 'El cambio de la contraseña fue exitoso.';
      } else {
        throw new BadRequestException(
          'La contraseña actual recibida no corresponde con la guardada en la aplicación',
        );
      }
    } catch (error) {
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException('Error interno del servidor');
      }
    }
  }
}
