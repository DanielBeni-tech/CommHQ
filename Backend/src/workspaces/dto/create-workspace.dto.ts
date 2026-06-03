import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(2, { message: "Le nom doit contenir au moins 2 caractères." })
  @MaxLength(60, { message: 'Le nom est trop long (max 60 caractères).' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'La description est trop longue (max 280 caractères).' })
  description?: string;
}
