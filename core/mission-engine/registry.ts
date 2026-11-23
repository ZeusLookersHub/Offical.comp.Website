import type { Blueprint } from './types.ts';
import { productPhoto } from './blueprints/product-photo.ts';
import { productVideo } from './blueprints/product-video.ts';
import { pitchDeck } from './blueprints/pitch-deck.ts';
import { landingPage } from './blueprints/landing-page.ts';
import { businessBlueprints } from './blueprints/business.ts';
import { writingBlueprints } from './blueprints/writing.ts';
import { designBlueprints } from './blueprints/design.ts';
import { marketingBlueprints } from './blueprints/marketing.ts';
import { deckBlueprints } from './blueprints/decks.ts';
import { careerBlueprints } from './blueprints/career.ts';
import { refineBlueprints } from './blueprints/refine.ts';
import { opsBlueprints } from './blueprints/ops.ts';
import { techBlueprints } from './blueprints/tech.ts';
import { researchBlueprints } from './blueprints/research.ts';
import { audioBlueprints } from './blueprints/audio.ts';
import { extraBlueprints } from './blueprints/extras.ts';
import { withBasis, withCoverage } from './basis.ts';

/** Pilot blueprints. Missions without one keep using the current chat workflow. */
export const blueprints: readonly Blueprint[] = ([productPhoto, productVideo, pitchDeck, landingPage, ...businessBlueprints, ...writingBlueprints, ...designBlueprints, ...marketingBlueprints, ...deckBlueprints, ...careerBlueprints, ...refineBlueprints, ...opsBlueprints, ...techBlueprints, ...researchBlueprints, ...audioBlueprints, ...extraBlueprints] as Blueprint[]).map(withBasis).map(withCoverage);

const byTopic = new Map(blueprints.flatMap(bp => bp.topics.map(topic => [topic, bp] as const)));
const byId = new Map(blueprints.map(bp => [bp.id, bp] as const));

export const blueprintForTopic = (topicId: string | undefined) => (topicId ? byTopic.get(topicId) : undefined);
export const blueprintById = (id: string) => byId.get(id);
