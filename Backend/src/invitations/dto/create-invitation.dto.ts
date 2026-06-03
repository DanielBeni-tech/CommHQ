import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateInvitationDto {
  /**
   * Si fourni, l'invitation ne pourra être consommée que par cette adresse email.
   * Sinon, c'est un lien ouvert à toute personne y ayant accès.
   */
  @IsOptional()
  @IsEmail({}, { message: "Adresse email invalide." })
  email?: string;
}
