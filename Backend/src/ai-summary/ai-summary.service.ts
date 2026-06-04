import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import { Summary, SummaryDocument } from './schemas/summary.schema';
import { MessagesService } from '../messages/messages.service';
import { ChannelsService } from '../channels/channels.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { sanitizePlainText } from '../common/utils/sanitize.util';

/**
 * Service du bot IA : produit un résumé en EXACTEMENT 3 phrases
 * mettant en avant décisions et actions à mener (cf. F-AI-1, F-AI-2).
 *
 * Deux providers possibles :
 *  - 'mock'   : résumé local déterministe (utile sans clé API, démo offline).
 *  - 'openai' : appel à l'API OpenAI (gpt-4o-mini par défaut).
 *
 * Le contenu est sanitisé avant stockage et diffusion via WebSocket.
 */
@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);

  constructor(
    @InjectModel(Summary.name) private readonly summaryModel: Model<SummaryDocument>,
    private readonly messagesService: MessagesService,
    private readonly channelsService: ChannelsService,
    private readonly messagesGateway: MessagesGateway,
    private readonly configService: ConfigService,
  ) {}

  async summarizeChannel(channelId: string, requesterId: string) {
    // 1) Vérifie l'accès au canal.
    await this.channelsService.ensureAccess(channelId, requesterId);

    // 2) Récupère les N derniers messages (avec auteurs).
    const messages = await this.messagesService.getRecentForSummary(channelId, 150);
    if (messages.length === 0) {
      throw new BadRequestException(
        "Aucun message à résumer dans ce canal pour l'instant.",
      );
    }

    // 3) Prépare la transcription (du plus ancien au plus récent).
    const transcript = messages
      .reverse()
      .map((m) => {
        const author =
          // @ts-expect-error populate dynamique : authorId est typé ObjectId mais peuplé en {name}
          (m.authorId && typeof m.authorId === 'object' && m.authorId.name) || 'Utilisateur';
        return `${author}: ${m.content}`;
      })
      .join('\n');

    // 4) Appel du provider IA pour produire 3 phrases.
    const provider = this.configService.get<string>('ai.provider') ?? 'mock';
    let sentences: string[];
    let modelUsed = 'mock';

    if (provider === 'openai') {
      sentences = await this.summarizeWithOpenAI(transcript);
      modelUsed = this.configService.get<string>('ai.openaiModel') ?? 'gpt-4o-mini';
    } else {
      sentences = this.summarizeWithMock(transcript);
    }

    // 5) Sanitisation défensive et garantie du format (exactement 3 phrases).
    sentences = this.normalizeToThreeSentences(sentences);

    const summary = await this.summaryModel.create({
      channelId: new Types.ObjectId(channelId),
      requestedByUserId: new Types.ObjectId(requesterId),
      sentences,
      messageCount: messages.length,
      modelUsed,
    });

    const payload = {
      id: summary._id.toString(),
      channelId,
      sentences,
      // Version "phrase unique" pratique pour le frontend (panneau de résumé compact).
      // On garde aussi `sentences` pour les clients qui veulent contrôler la mise en forme.
      summary: sentences.join(' '),
      messageCount: messages.length,
      modelUsed,
      createdAt: (summary as unknown as { createdAt: Date }).createdAt,
    };

    // 6) Diffusion temps réel à tous les sockets du canal.
    this.messagesGateway.broadcastSummary(channelId, payload);

    return payload;
  }

  async listForChannel(channelId: string, requesterId: string) {
    await this.channelsService.ensureAccess(channelId, requesterId);
    return this.summaryModel
      .find({ channelId: new Types.ObjectId(channelId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();
  }

  // ─────────────────────────────────────────────────────────────
  // Providers
  // ─────────────────────────────────────────────────────────────

  /**
   * Provider 'openai' : utilise l'API OpenAI Chat Completions.
   * On utilise `fetch` natif (Node 18+) pour éviter une dépendance supplémentaire.
   *
   * Prompt contraint : forcer 3 phrases, axées DÉCISIONS et ACTIONS.
   */
  private async summarizeWithOpenAI(transcript: string): Promise<string[]> {
    const apiKey = this.configService.get<string>('ai.openaiApiKey');
    const model = this.configService.get<string>('ai.openaiModel') ?? 'gpt-4o-mini';
    if (!apiKey) {
      this.logger.warn("AI_PROVIDER=openai mais OPENAI_API_KEY manquant — fallback mock.");
      return this.summarizeWithMock(transcript);
    }

    const systemPrompt =
      "Tu es un assistant qui résume des discussions d'équipe technique. " +
      "Réponds UNIQUEMENT en JSON valide avec la forme exacte : " +
      '{"sentences": ["phrase 1", "phrase 2", "phrase 3"]}. ' +
      'Le tableau doit contenir EXACTEMENT 3 phrases en français, courtes et factuelles, ' +
      'mettant en avant les décisions prises et les actions à mener.';

    const userPrompt = `Voici la discussion :\n\n${transcript}\n\nRésume-la.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenAI API a répondu ${response.status} : ${errorText}`);
        return this.summarizeWithMock(transcript);
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content ?? '';
      const parsed = JSON.parse(content) as { sentences?: string[] };

      if (!Array.isArray(parsed.sentences)) {
        return this.summarizeWithMock(transcript);
      }
      return parsed.sentences;
    } catch (error) {
      this.logger.error(`Échec OpenAI : ${(error as Error).message}`);
      return this.summarizeWithMock(transcript);
    }
  }

  /**
   * Provider 'mock' : génère un résumé local plausible, sans appel externe.
   * Stratégie :
   *  - phrase 1 = volumétrie (nombre de messages, nombre de contributeurs)
   *  - phrase 2 = aperçu du contenu (premier message synthétisé)
   *  - phrase 3 = clôture (dernier message synthétisé)
   *
   * Utile pour la démo hackathon sans clé d'API et pour les tests.
   */
  private summarizeWithMock(transcript: string): string[] {
    const lines = transcript.split('\n').filter((l) => l.trim().length > 0);
    const contributors = new Set(lines.map((l) => l.split(':')[0].trim()));
    const first = this.snippet(lines[0] ?? '');
    const last = this.snippet(lines[lines.length - 1] ?? '');

    return [
      `La discussion contient ${lines.length} message(s) impliquant ${contributors.size} contributeur(s).`,
      `Premier point abordé : ${first || 'discussion générale sans contenu textuel clair'}.`,
      `Dernier point soulevé : ${last || 'à confirmer'}.`,
    ];
  }

  /**
   * Garantit qu'on a EXACTEMENT 3 phrases, sanitisées.
   * Si l'IA en renvoie plus ou moins, on tronque / complète proprement.
   */
  private normalizeToThreeSentences(sentences: string[]): string[] {
    const cleaned = sentences
      .map((s) => sanitizePlainText(String(s)))
      .filter((s) => s.length > 0);

    while (cleaned.length < 3) {
      cleaned.push('—');
    }
    return cleaned.slice(0, 3);
  }

  private snippet(line: string): string {
    const afterColon = line.includes(':') ? line.slice(line.indexOf(':') + 1) : line;
    const trimmed = afterColon.trim().replace(/\s+/g, ' ');
    return trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed;
  }
}
