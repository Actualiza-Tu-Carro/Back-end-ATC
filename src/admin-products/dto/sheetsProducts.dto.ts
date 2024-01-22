import {
  IsNotEmpty,
  IsString,
  IsEnum,
  Length,
  IsOptional,
} from 'class-validator';
import {
  ConditionProduct,
  StateProduct,
} from 'src/products/entities/product.entity';

export class SheetsProductDto {
  @IsNotEmpty({
    message: 'El campo "Número de publicación", no debe estar vacío',
  })
  @IsNotEmpty({
    message: 'El campo "Número de publicación", no debe estar vacío',
  })
  @IsString()
  'Número de publicación': string;

  @IsNotEmpty({ message: 'El campo "Título", no debe estar vacío' })
  @IsString()
  @Length(1, 60)
  Título: string;

  @IsNotEmpty({ message: 'El campo "Precio COP", no debe estar vacío' })
  @IsString()
  'Precio COP': string;

  @IsNotEmpty({ message: 'El campo "Descripción", no debe estar vacío' })
  @IsString()
  Descripción: string;

  @IsString()
  Fotos: string;

  @IsNotEmpty({
    message: 'El campo "Stock", no debe estar vacío y debe ser numérico',
  })
  @IsString()
  Stock: string;

  @IsNotEmpty({
    message:
      "El campo \"Estado\", no debe estar vacío. Debe contener los valores 'Activa' o'Inactiva'",
  })
  @IsEnum(StateProduct)
  Estado: StateProduct;

  @IsNotEmpty({
    message:
      'El campo $property, no debe estar vacío y debe ser de una de las tres opciones descritas "Nuevo", "Remanufacturado" o "Usado".',
  })
  @IsEnum(ConditionProduct)
  Condición: ConditionProduct;

  @IsNotEmpty({
    message:
      'El campo "Disponibilidad de stock", no debe estar vacío y su valor solo puede ser numérico!',
  })
  'Disponibilidad de stock (días)': string;

  @IsNotEmpty({ message: 'El campo "Categoría", no debe estar vacío' })
  @IsString()
  Categoría: string;

  @IsNotEmpty({ message: 'El campo "Marca", no debe estar vacío' })
  @IsString()
  Marca: string;

  @IsOptional()
  @IsString()
  Modelo: string;

  @IsOptional()
  @IsString()
  Año: string;
}
