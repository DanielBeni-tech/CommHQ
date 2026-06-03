import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDirectMessageDto {
  @IsMongoId({ message: "L'identifiant du destinataire est invalide." })
  toUserId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  content!: string;
}
