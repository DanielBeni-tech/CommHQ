import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Données nécessaires à la création d'un compte.
 * Si `invitationToken` est fourni, l'utilisateur sera automatiquement ajouté
 * comme membre de l'espace de travail associé à l'invitation.
 */
export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
  @MaxLength(60, { message: 'Le nom est trop long (max 60 caractères).' })
  name!: string;

  @IsEmail({}, { message: 'Adresse email invalide.' })
  @MaxLength(120)
  email!: string;

  /**
   * Politique mot de passe : 8+ caractères, au moins une lettre et un chiffre.
   * On reste raisonnable pour un hackathon ; à durcir en production (NIST 800-63).
   */
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Le mot de passe doit contenir au moins une lettre et un chiffre.',
  })
  password!: string;

  @IsOptional()
  @IsUrl({}, { message: "L'URL de l'avatar n'est pas valide." })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  invitationToken?: string;
}
