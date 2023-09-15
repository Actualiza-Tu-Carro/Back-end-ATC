import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Inject,
  forwardRef,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ICreateUser } from './interfaces/create-user.interface';
import { ShoppingCart } from 'src/shopping-cart/entities/shopping-cart.entity';
import { IResponse } from 'src/utils/interfaces/response.interface';
import { MailService } from 'src/mail/mail.service';
import { Cases } from 'src/mail/dto/sendMail.dto';
import { ShoppingCartService } from 'src/shopping-cart/shopping-cart.service';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @Inject(MailService)
    private mailsService: MailService,
    @Inject(forwardRef(() => ShoppingCartService))
    private shopCartService: ShoppingCartService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<ICreateUser> {
    try {
      const data = {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: await this.authService.generatePassword(
          createUserDto.password,
        ),
        phone: createUserDto.phone,
      };

      const newUser = await this.userModel.create(data);

      await this.shopCartService.CreateShoppingCart(newUser.id, null);

      if (newUser) {
        const response = {
          statusCode: 201,
          token: await this.authService.generateToken(
            newUser.id,
            newUser.email,
          ),
        };

        //Setting up for email sending
        const context = {
          name: createUserDto.firstName,
          link: 'http://actualizaTuCarro.com', //Link falso. Reemplazar por link de verdad
        };
        const mailData = {
          addressee: createUserDto.email,
          subject: Cases.CREATE_ACCOUNT,
          context: context,
        };
        //Sending mail
        const mail = await this.mailsService.sendMails(mailData);

        return response;
      } else {
        throw new BadRequestException(
          'Error al crear el usuario verifique los datos enviados e intentelo nuevamente',
        );
      }
    } catch (error) {
      console.log(error);
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException(
            'Erron interno del servidor, intente mas tarde',
          );
      }
    }
  }

  async signIn(loginUserDto: LoginUserDto): Promise<ICreateUser> {
    try {
      const { email, password } = loginUserDto;
      const checkUser = await this.findOneByEmail(email);

      const comparePassword = await this.authService.comparePassword(
        password,
        checkUser.password,
      );

      if (comparePassword) {
        const response = {
          statusCode: 200,
          token: await this.authService.generateToken(
            checkUser.id,
            checkUser.email,
          ),
        };

        return response;
      } else {
        throw new UnauthorizedException(
          'La contraseña ingresada no es valida, verifiquela e intente de nuevo',
        );
      }
    } catch (error) {
      switch (error.constructor) {
        case UnauthorizedException:
          throw new UnauthorizedException(error.message);
        default:
          throw new InternalServerErrorException('Error interno del servidor.');
      }
    }
  }

  public async findOneByEmail(email: string): Promise<User> {
    try {
      const user = await User.findOne({ where: { email } });

      if (user) {
        return user;
      } else {
        throw new UnauthorizedException(
          'El email ingresado no corresponde a ningun usuario registrado.',
        );
      }
    } catch (error) {
      switch (error.constructor) {
        case UnauthorizedException:
          throw new UnauthorizedException(error.message);
        default:
          throw new InternalServerErrorException('Error interno del servidor.');
      }
    }
  }

  async verifyEmail(email: string): Promise<boolean> {
    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return true;
      } else {
        throw new ConflictException(
          'Ya existe una cuenta creada con este correo, puedes iniciar sesión.',
        );
      }
    } catch (error) {
      switch (error.constructor) {
        case ConflictException:
          throw new ConflictException(error.message);
        default:
          throw new InternalServerErrorException(
            'Error interno del servidor, intente mas tarde',
          );
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<IResponse> {
    try {
      const user = await User.findByPk(id);

      if (user) {
        if (updateUserDto.firstName) {
          user.firstName = updateUserDto.firstName;
        }
        if (updateUserDto.lastName) {
          user.lastName = updateUserDto.lastName;
        }
        if (updateUserDto.email) {
          user.email = updateUserDto.email;
        }

        if (updateUserDto.phone) {
          user.phone = updateUserDto.phone;
        }

        await user.save();

        return {
          statusCode: 204,
          message: 'Usuario actualizado correctamente',
        };
      } else {
        throw new BadRequestException(
          'El id enviado no corresponde a ningun usuario',
        );
      }
    } catch (error) {
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException(
            'Error del servidor, intente mas tarde',
          );
      }
    }
  }

  async getAll() {
    try {
      const users = await this.userModel.findAll();
      return users;
    } catch (error) {
      throw new HttpException('Error al buscar usuarios.', 404);
    }
  }
}
