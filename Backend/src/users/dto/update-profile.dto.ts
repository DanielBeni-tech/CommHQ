import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
  @MaxLength(60, { message: 'Le nom est trop long (max 60 caractères).' })
  name?: string;

  @IsOptional()
  @IsUrl({}, { message: "L'URL de l'avatar n'est pas valide." })
  avatarUrl?: string;
}
