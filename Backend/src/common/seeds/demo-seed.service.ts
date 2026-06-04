import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../../auth/auth.service';
import { UsersService } from '../../users/users.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { MessagesService } from '../../messages/messages.service';
import { ChannelsService } from '../../channels/channels.service';

/**
 * Crée un compte de démonstration au démarrage du backend si la variable
 * `SEED_DEMO=true`. Idempotent : si le compte existe déjà, on ne fait rien.
 *
 * Utilisé pour que les identifiants pré-remplis sur la page de connexion
 * du frontend (`camille@acme.dev` / `demo1234`) soient immédiatement
 * fonctionnels en démo, sans étape d'inscription manuelle.
 */
@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
    private readonly messagesService: MessagesService,
    private readonly channelsService: ChannelsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const enabled = this.configService.get<string>('seedDemo') === 'true';
    if (!enabled) return;

    const email = 'camille@acme.dev';
    const password = 'demo1234';
    const name = 'Camille Demo';

    if (await this.usersService.existsByEmail(email)) {
      this.logger.log(`Compte de démo déjà présent (${email}).`);
      return;
    }

    this.logger.log(`🌱 Création du compte de démonstration (${email})…`);

    const auth = await this.authService.register({
      name,
      email,
      password,
    });
    const userId = auth.user.id;

    const ws = await this.workspacesService.create(userId, {
      name: 'Acme Demo',
      description: 'Espace de démo CommHQ',
    });

    // Quelques messages d'amorçage dans #general pour pouvoir tester
    // immédiatement l'IA de résumé.
    const channels = await this.channelsService.listForWorkspace(ws.id, userId);
    const general = channels.find((c) => c.name === 'general');
    if (general) {
      const seedMessages = [
        'Bienvenue sur CommHQ ! Cet espace est prêt pour la démo.',
        'On part sur **NestJS + MongoDB** côté backend, et **React + Vite** côté frontend.',
        'Pensez à tester le bouton ✨ *Résumer le canal* en haut à droite.',
      ];
      for (const content of seedMessages) {
        await this.messagesService.create(general.id, userId, content);
      }
    }

    this.logger.log(
      `✅ Démo prête. Connectez-vous avec : ${email} / ${password}`,
    );
  }
}
