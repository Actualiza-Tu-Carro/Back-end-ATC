import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ICreateUser } from './interfaces/create-user.interface';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
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

      if (newUser) {
        const response = {
          statusCode: 201,
          token: await this.authService.generateToken(
            newUser.id,
            newUser.email,
          ),
        };

        return response;
      } else {
        throw new BadRequestException(
          'Error al crear el usuario verifique los datos enviados e intentelo nuevamente',
        );
      }
    } catch (error) {
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

  async signIn(loginUserDto: LoginUserDto) {
    try {
      const { email, password } = loginUserDto;
      const checkUser = await this.findOneByEmail(email);

      if (checkUser) {
        const comparePassword = await this.authService.comparePassword(
          password,
          checkUser.password,
        );

        if (comparePassword) {
          const response = {
            id: checkUser.id,
            rol: checkUser.rol,
            token: await this.authService.generateToken(
              checkUser.id,
              checkUser.email,
            ),
          };

          return response;
        } else {
          throw new Error('Incorrect password');
        }
      } else {
        throw new Error('The email entered does not correspond to any user');
      }
    } catch (err) {
      return { message: err.message };
    }
  }

  findAll() {
    return 'This action returns all users';
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  public async findOneByEmail(email: string) {
    try {
      const user = await User.findOne({ where: { email } });

      if (user) {
        return user;
      } else {
        throw new BadRequestException();
      }
    } catch (err) {}
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
          throw new ConflictException(error.message());
        default:
          throw new InternalServerErrorException(
            'Error interno del servidor, intente mas tarde',
          );
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
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

        return user;
      } else {
        throw new Error('Usuario no encontrado');
      }
    } catch (err) {
      return { message: err.message };
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
