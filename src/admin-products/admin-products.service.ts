import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ExcelProductDto } from './dto/exelProducts.dto';
import axios from 'axios';

import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';

/* entities */
import { Product } from 'src/products/entities/product.entity';
import { Categories } from 'src/categories/entities/category.entity';
import { Brand } from 'src/brands/entities/brand.entity';

/* interface */
import { IResponseCreateOrUpdateProducts } from './interfaces/response-create-update.interface';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class AdminProductsService {
  constructor(
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
  ) {}

  //Usa una url al archivo original para obtener la información y retornar un buffer
  async getExcelData(url: string): Promise<Buffer> {
    try {
      const { data }: { data: Buffer } = await axios.get(url, {
        responseType: 'arraybuffer',
      });

      if (!data)
        throw new NotFoundException(
          `No se ha encontrado el contenido de la URL solicitada \'${url}\'`,
        );

      return data;
    } catch (error) {
      switch (error.constructor) {
        case NotFoundException:
          throw new NotFoundException(error.message);
        default:
          throw new InternalServerErrorException(
            `Hubo un problema al solicitar los datos a la URL: ${url}`,
          );
      }
    }
  }

  excelToCsv(excelData: Buffer): string {
    try {
      //Parse a buffer wich contains the data to save in DB
      const workbook = XLSX.read(excelData, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];

      if (!sheetName)
        throw new ConflictException(
          'Hubo un problema a la hora de trabajár el Excel!. Recuerde ponerle un nombre a la hoja de trabajo',
        );

      const worksheet = workbook.Sheets[sheetName];

      if (!workbook)
        throw new ConflictException(
          'Hubo un problema a la hora de trabajár el Excel!. confirme que la hoja de trabajo esté guardada',
        );

      const csvData = XLSX.utils.sheet_to_csv(worksheet);

      return csvData;
    } catch (error) {
      switch (error.constructor) {
        case ConflictException:
          throw new ConflictException(error.message);
        default:
          throw new InternalServerErrorException(
            'Hubo un problema en el servidor al realizar la operación Excel => .csv',
          );
      }
    }
  }

  async csvToJson(csvData: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,

        complete: (result) => {
          // Mapeo de nombres de propiedades
          const propertyMapping = {
            '': 'Número de publicación',
            'A': 'Título',
            'B': 'Categoría',
            'C': 'Fotos',
            'D': 'Stock',
            'E': 'Precio COP',
            'F': 'Estado',
            'G': 'Descripción',
            'H': 'Condicion',
            'I': 'Disponibilidad de stock (días)',
            'J': 'Marca',
            'K': 'Modelo',
            'L': 'Año',
          };

          // Transformar el resultado para incluir solo las propiedades A hasta K con nuevos nombres
          const transformedData = result.data.map((row) => {
            const filteredRow = {};
            // Copiar y renombrar las propiedades A hasta l
            for (const prop in row) {
              if (prop <= 'L' && propertyMapping[prop]) {
                filteredRow[propertyMapping[prop]] = row[prop];
              }
            }
            return filteredRow;
          });

          transformedData.shift();
          resolve(transformedData);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  /* ya sin utilizar */
  /* private async findThisProduct(id: string): Promise<Product | null> {
    const thisProduct: Product | null = await Product.findByPk(id);
    return thisProduct;
  } */

  private async createNewProduct(
    product: ExcelProductDto,
    index: number,
  ): Promise<void> {
    const categoryId = await this.getOrCreateInEntitis(
      Categories,
      product.Categoría,
      index,
    );

    const brandId = await this.getOrCreateInEntitis(
      Brand,
      product.Marca,
      index,
    );

    await this.productsService.createGenericProduct(
      product,
      brandId,
      categoryId,
      index,
    );

    return;
  }

  //Crea o actualiza un producto en DB
  async JsonToDatabase(
    allProducts: any[],
  ): Promise<IResponseCreateOrUpdateProducts> {
    for (const [index, value] of allProducts.entries()) {
      const thisProduct: Product | null =
        await this.productsService.findByPkToValidateExistentProduct(
          value['Número de publicación'],
          {},
        );

      if (thisProduct) {
        await this.updateProduct(thisProduct, value, index);
      } else {
        await this.createNewProduct(value, index);
      }
    }

    return {
      statusCode: 201,
      message: 'Productos creados / actualizados con éxito!',
    };
  }

  private async getOrCreateInEntitis(
    Entity: typeof Categories | typeof Brand,
    name: string,
    index: number,
  ): Promise<string> {
    try {
      const [thisResult]: [Categories | Brand, boolean] =
        await Entity.findOrCreate({
          where: { name },
        });

      if (!thisResult)
        throw new NotFoundException(
          `No se pudo encontrar entre las entidades a ${name}, en el Indice: ${
            index + 2
          }`,
        );

      return thisResult.id;
    } catch (error) {
      switch (error.constructor) {
        case NotFoundException:
          throw new NotFoundException(error.message);
        default:
          throw new InternalServerErrorException(
            `Ocurrio un error al consultar la entidad ${Entity.tableName}`,
          );
      }
    }
  }

  private async updateProduct(
    thisProduct: Product,
    product: ExcelProductDto,
    index: number,
  ): Promise<void> {
    try {
      //Se obtiene o, de no existir, se crea una nueva categoría y luego retorna el id
      //Lo mismo se aplica para el Brand
      const categoryId: string = await this.getOrCreateInEntitis(
        Categories,
        product.Categoría,
        index,
      );

      const brandId: string = await this.getOrCreateInEntitis(
        Brand,
        product.Marca,
        index,
      );
      //Se actualiza el producto
      thisProduct.title = product.Título;
      thisProduct.description = product.Descripción;
      thisProduct.state = product.Estado;
      thisProduct.stock = Number(product.Stock);
      thisProduct.availability =
        Number(product['Disponibilidad de stock (días)']) || 0;
      thisProduct.image = [''];
      thisProduct.year = product.Año,
      thisProduct.brandId = brandId;
      thisProduct.categoryId = categoryId;

      await thisProduct.save();

      return;
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrio un error al Actualizar el producto ${
          product.Título
        }, en el Indice: ${index + 2}`,
      );
    }
  }
}
