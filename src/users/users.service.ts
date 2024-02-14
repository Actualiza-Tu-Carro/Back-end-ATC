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
import { Rol, User } from './entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ICreateUser } from './interfaces/create-user.interface';
import { IResponse } from '../utils/interfaces/response.interface';
import { MailService } from '../mail/mail.service';
import { Cases } from '../mail/dto/sendMail.dto';
import { HttpStatusCode } from 'axios';
import { ICreateUserContext } from '../mail/interfaces/create-account-context.interface';
import { OrderItem, Transaction, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ShoppingCartService } from '../shopping-cart/shopping-cart.service';
import { FindOptions, or } from 'sequelize';
import { EModelsTable } from '../utils/custom/EmodelsTable.enum';
import { DirectionsService } from '../directions/directions.service';
import { ReviewsService } from '../reviews/reviews.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { GenericPaginateUserInt } from './interfaces/genericsIntUsers.interface';
import { Product } from 'src/products/entities/product.entity';
import { ShoppingCart } from 'src/shopping-cart/entities/shopping-cart.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { UserProductFav } from 'src/orders/entities/userProductFav.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Direction } from 'src/directions/entities/direction.entity';
import { Categories } from 'src/categories/entities/category.entity';
import { Brand } from 'src/brands/entities/brand.entity';
import { IUpdateUserRol } from './interfaces/updateUserRol.interface';
import { Op } from 'sequelize';
import { Image } from 'src/products/entities/image.entity';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @Inject(MailService)
    private mailsService: MailService,
    @Inject(forwardRef(() => ProductsService))
    private productService: ProductsService,
    @Inject(forwardRef(() => ShoppingCartService))
    private shopCartService: ShoppingCartService,
    private sequelize: Sequelize,
    @Inject(forwardRef(() => DirectionsService))
    private directionService: DirectionsService,
    @Inject(forwardRef(() => ReviewsService))
    private reviewService: ReviewsService,
    @Inject(forwardRef(() => OrdersService))
    private orderService: OrdersService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentService: PaymentsService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<ICreateUser> {
    const transaction: Transaction = await this.sequelize.transaction();
    try {
      const data = {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: await this.authService.generatePassword(
          createUserDto.password,
        ),
        phone: createUserDto.phone,
        isActive: true,
      };

      const newUser = await this.userModel.create(data, { transaction });

      const response = {
        statusCode: 201,
        token: await this.authService.generateToken(
          newUser.id,
          newUser.email,
          newUser.rol,
        ),
      };

      //Setting up for email sending
      const context: ICreateUserContext = {
        firstname: createUserDto.firstName,
        lastname: createUserDto.lastName,
        /* link: 'http://actualizaTuCarro.com', //Link falso. Reemplazar por link de verdad */
      };

      const mailData = {
        EmailAddress: createUserDto.email,
        subject: Cases.CREATE_ACCOUNT,
        context: context,
      };
      //Sending mail
      await this.mailsService.sendMails(mailData);

      await transaction.commit();

      return response;
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        'Erron interno del servidor, intente mas tarde \n' + error.message,
      );
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
            checkUser.rol,
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
          throw new InternalServerErrorException(
            'Error interno del servidor.\n' + error.message,
          );
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
          throw new InternalServerErrorException(
            'Error interno del servidor.\n' + error.message,
          );
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
      const user = await User.update(updateUserDto, { where: { id } });
      if (user) {
        return {
          statusCode: 204,
          message: 'Usuario actualizado correctamente',
        };
      } else {
        throw new BadRequestException(
          'No hay usuario que coincida con el Id recibido en la base de datos.',
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

  async getAll(page: number, limit: number, order: string) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await this.userModel.findAndCountAll({
        limit,
        offset,
        order: [[order.split(' ')[0], order.split(' ')[1]]],
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'rol'],
        subQuery: false,
        include: [
          {
            model: ShoppingCart,
            attributes: ['id'],
            include: [
              {
                model: Product,
                attributes: ['id', 'title', 'state', 'price'],
                include: [{ model: Categories }, { model: Brand }, { model: Image, attributes: ['image'] }],
                through: { attributes: ['id', 'amount'] },
              },
            ],
          },
          {
            model: Order,
            attributes: ['id'],
            include: [
              {
                model: Payment,
                attributes: ['id', 'amount', 'state', 'user_email'],
              },
              {
                model: Product,
                attributes: ['id', 'title', 'state', 'price'],
                include: [{ model: Categories }, { model: Brand }, { model: Image, attributes: ['image'] }],
                through: { attributes: ['amount', 'price'] },
              },
              {
                model: Direction,
                attributes: [
                  'id',
                  'city',
                  'district',
                  'address',
                  'addressReference',
                  'neighborhood',
                  'phone',
                ],
              },
            ],
          },
          {
            model: Review,
            attributes: ['id', 'review', 'rating'],
          },
          {
            model: Direction,
            attributes: [
              'id',
              'city',
              'district',
              'address',
              'addressReference',
              'neighborhood',
              'phone',
            ],
          },
        ],
      });

      

      return {
        totalUser: count,
        totalPages: Math.ceil(count / limit),
        users: rows,
        page,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar usuarios.' + error.message);
    }
  }

  async deleteUser(id: string): Promise<any> {
    const transaction: Transaction = await this.sequelize.transaction();
    try {
      const user = await this.userModel.findByPk(id, { transaction });
      user.isActive = !user.isActive;

      if (!user.isActive) {
        /* Realiza la eliminación del carrito de compras dentro de la transacción. */
        return await this.shopCartService
          .destroyShoppingCart({ userId: id }, transaction)
          .then(async () => {
            await user.save().then(async () => transaction.commit());
            return {
              message: `Se inactivó la cuenta del Usuario: ${user.firstName + ' ' + user.lastName
                } correctamente.`,
              status: HttpStatusCode.NoContent,
            };
          });
      } else {
        /* Realiza la creación del carrito de compras dentro de la transacción. */
        return await this.shopCartService
          .CreateShoppingCart({ userId: id }, transaction)
          .then(async () => {
            await user.save().then(async () => transaction.commit());
            return {
              message: `Se ah restaurado la cuenta del Usuario ${user.firstName + ' ' + user.lastName
                } correctamente.`,
              status: HttpStatusCode.Ok,
            };
          });
      }
    } catch (error) {
      await transaction.rollback();
      throw new HttpException(
        'Error al cambiar el estado del usuario.\nIntentelo más tarde.',
        404,
      );
    }
  }

  /* Public functions a utilizar en diferentes modulos */

  public async genericUser(
    method: EModelsTable,
    options: FindOptions,
  ): Promise<User[] | User> {
    try {
      const genericResponseUser = await User[method](options);
      if (!genericResponseUser)
        throw new BadRequestException(
          `No se encontraron datos para la solucitud de tipo ${method}`,
        );
      return genericResponseUser;
    } catch (error) {
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException(
            `Ocurrio un error al trabajar la entidad usuario a la hora de indagar por ${method}`,
          );
      }
    }
  }

  public async findAndCountAllGenericUser(
    options: FindOptions,
    page: number,
  ): Promise<GenericPaginateUserInt> {
    try {
      const genericResponseUser = await User.findAndCountAll(options);
      if (!genericResponseUser)
        throw new BadRequestException(
          'No se encontraron datos para la solucitud de tipo findAndCountAll',
        );
      return {
        data: genericResponseUser.rows,
        page,
        totalPages: Math.ceil(genericResponseUser.count / options.limit),
        totalUsers: genericResponseUser.count,
      };
    } catch (error) {
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException(
            'Ocurrio un error al trabajar la entidad usuario a la hora de indagar por findAndCountAll',
          );
      }
    }
  }

  public async findByPkGenericUser(
    userId: string,
    options: FindOptions,
  ): Promise<User> {
    try {
      const genericResponseUser = await User.findByPk(userId, options);
      if (!genericResponseUser)
        throw new BadRequestException('No ha sido posible encontro al usuario');
      return genericResponseUser;
    } catch (error) {
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException(
            'Ocurrio un error al trabajar la entidad usuario a la hora de indagar por ususario particular',
          );
      }
    }
  }

  async findProfileUser(userId: string): Promise<User> {
    try {
      const genericResponseUser = await User.findByPk(userId, {
        attributes: ['firstName', 'lastName', 'email', 'phone'],
        include: [
          {
            model: ShoppingCart,
            attributes: ['id'],

            include: [
              {
                model: Product,
                attributes: ['id', 'title', 'state', 'price'],
                include: [{ model: Categories }, { model: Brand }, { model: Image, attributes: ['image'] }],
                through: { attributes: ['id', 'amount'] },
              },
            ],
          },
          {
            model: Order,
            attributes: ['id'],
            include: [
              {
                model: Payment,
                attributes: ['id', 'amount', 'state', 'user_email'],
              },
              {
                model: Product,
                attributes: ['id', 'title', 'state', 'price'],
                include: [{ model: Categories }, { model: Brand }, { model: Image, attributes: ['image'] }],
                through: { attributes: ['amount', 'price'] },
              },
              {
                model: Direction,
                attributes: [
                  'id',
                  'city',
                  'district',
                  'address',
                  'addressReference',
                  'neighborhood',
                  'phone',
                ],
              },
            ],
            /* a agregar una vez se hayan hecho las uniones respectivas con Payment entiti */
          },
          {
            model: UserProductFav,
            attributes: ['id'],
            include: [
              {
                model: Product,
                attributes: ['id', 'title', 'state', 'price'],
                include: [{ model: Categories }, { model: Brand }, { model: Image, attributes: ['image'] }],
                through: { attributes: [] },
              },
            ],
          },
          {
            model: Review,
            attributes: ['id', 'review', 'rating'],
          },
          {
            model: Direction,
            attributes: [
              'id',
              'city',
              'district',
              'address',
              'addressReference',
              'neighborhood',
              'phone',
            ],
          },
        ],
      });
      if (!genericResponseUser)
        throw new BadRequestException('No ha sido posible encontro al usuario');
      return genericResponseUser;
    } catch (error) {
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException(
            'Ocurrio un error al trabajar la entidad Usuario a la hora de indagar por el perfil del usuario.\n' +
            error.message,
          );
      }
    }
  }

  async updateOneUserRol(user: IUpdateUserRol): Promise<void> {
    try {
      const updateCount = await this.userModel.update(
        { rol: user.rol },
        { where: { id: user.id } },
      );
      if (!updateCount[0]) {
        throw new BadRequestException(
          'No se pudo encontrar al usuario indicado.',
        );
      }
      return;
    } catch (error) {
      switch (error.constructor) {
        case BadRequestException:
          throw new BadRequestException(error.message);
        default:
          throw new InternalServerErrorException(
            `Ocurrio un problema en el servidor al intentar actualizar el rol del usuario.\nError: ${error.message}`,
          );
      }
    }
  }
}
