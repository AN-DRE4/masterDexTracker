export type SectionKey =
  | 'living_dex'
  | 'gender_forms'
  | 'stars'
  | 'shiny_living_dex'
  | 'shiny_gender_forms';

export interface DexEntry {
  id: number;
  box: number;
  row: number;
  slot: number;
  national_dex_number: number;
  name: string;
  bulbapedia_url: string;
  image_url: string;
  games: string;
  notes: string;
  caught: boolean;
  section: SectionKey;
  sort_order: number;
  star_difficulty: string | null;
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  living_dex: 'Living Dex',
  gender_forms: 'Gender Variants & Forms',
  stars: 'Stars',
  shiny_living_dex: 'Shiny Living Dex',
  shiny_gender_forms: 'Shiny Gender Variants & Forms',
};
