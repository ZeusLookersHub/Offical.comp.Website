import type { Blueprint } from './types.ts';

export interface ResourceNeed {
  blueprint: string;
  slot: string;
  option: string;
  media: 'image' | 'video' | 'layout';
  asset: string;
  description: string;
  generate: string;
}

/** Every visual example the chat can show, with the prompt to produce it. Source for RESOURCES.md. */
export function listResources(list: readonly Blueprint[]): ResourceNeed[] {
  return list.flatMap(bp => bp.slots.flatMap(slot => (slot.options ?? []).filter(o => o.visual).map(o => ({
    blueprint: bp.id, slot: slot.id, option: o.value, media: o.visual!.media,
    asset: o.visual!.asset ?? '', description: o.visual!.description.en, generate: o.visual!.generate ?? '',
  }))));
}
