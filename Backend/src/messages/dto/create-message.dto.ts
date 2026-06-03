import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Le contenu est en Markdown. La limite de 8000 caractères couvre
 * largement les blocs de code raisonnables. Au-delà, on encourage le partage de fichier.
 */
export class CreateMessageDto {
  @IsString()
  @MinLength(1, { message: 'Le message ne peut pas être vide.' })
  @MaxLength(8000, { message: 'Message trop long (max 8000 caractères).' })
  content!: string;
}
