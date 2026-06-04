import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Mise à jour partielle d'un canal — utilisé par PATCH /channels/:id.
 * Les contraintes de format restent identiques à la création.
 */
export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      'Le nom du canal doit contenir uniquement des lettres minuscules, chiffres, "-" ou "_".',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
