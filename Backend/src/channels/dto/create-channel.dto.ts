import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChannelDto {
  /**
   * Convention : noms en minuscules, sans espaces (comme Slack).
   * Lettres, chiffres, tirets et underscores autorisés.
   */
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      'Le nom du canal doit contenir uniquement des lettres minuscules, chiffres, "-" ou "_".',
  })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
