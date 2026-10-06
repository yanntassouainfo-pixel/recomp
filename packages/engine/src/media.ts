/**
 * Photos (Unsplash, licence Unsplash : usage commercial permis, attribution affichée).
 * URLs « regular » hotlinkées comme le demandent les guidelines ; crédit photographe + lien utm.
 * Remplacer par des photos propres (shooting fondateur) ou générées quand elles existeront.
 */
export interface Photo {
  url: string;
  alt: string;
  credit: string; // nom du photographe
  creditUrl: string; // page profil
  source: 'unsplash' | 'own' | 'generated';
}

const U = (id: string, path: string, alt: string, credit: string, user: string): Photo => ({
  url: `https://images.unsplash.com/${path}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200&ixid=${id}`,
  alt,
  credit,
  creditUrl: `https://unsplash.com/@${user}?utm_source=recomp&utm_medium=referral`,
  source: 'unsplash',
});

/** Photo par exercice (certains mouvements n'ont pas encore de photo : le pictogramme reste). */
export const EXERCISE_PHOTOS: Record<string, Photo> = {
  squat: U('qbktVctZKL4', 'photo-1758875568582-ec8a4229c2b0', 'Femme réalisant un squat barre avec un coach', 'Vitaly Gariev', 'silverkblack'),
  goblet_squat: U('0tQLfwcr5-M', 'photo-1706029831387-fd8bc3d27d01', 'Femme tenant une kettlebell en salle', 'Ambitious Studio | Rick Barrett', 'weareambitious'),
  bodyweight_squat: U('0tQLfwcr5-M', 'photo-1706029831387-fd8bc3d27d01', 'Femme en position de squat', 'Ambitious Studio | Rick Barrett', 'weareambitious'),
  leg_press: U('xwMlVSqP20U', 'photo-1434682772747-f16d3ea162c3', 'Femme sur une machine de musculation', 'Scott Webb', 'scottwebb'),
  deadlift: U('WvDYdXDzkhs', 'photo-1517836357463-d25dfeac3438', 'Personne en position de départ du soulevé de terre', 'Victor Freitas', 'victorfreitas'),
  romanian_deadlift: U('vqDAUejnwKw', 'photo-1521804906057-1df8fdb718b7', 'Personne soulevant une barre du sol', 'Victor Freitas', 'victorfreitas'),
  split_squat: U('ACbu5AY5Tvk', 'photo-1609377375722-46264cf88939', 'Femme en fente', 'Bradley Dunn', 'bradleycdunn'),
  walking_lunge: U('ACbu5AY5Tvk', 'photo-1609377375722-46264cf88939', 'Femme en fente', 'Bradley Dunn', 'bradleycdunn'),
  bench_press: U('Dueawl5Q75s', 'photo-1690731033723-ad718c6e585a', 'Homme au développé couché', 'Shoham Avisrur', 'shoham_avisrur'),
  db_bench: U('i2GS_MtW9hM', 'photo-1652363722833-509b3aac287b', 'Personne au développé haltères', 'Michael DeMoya', 'demoya'),
  chest_press_machine: U('i2GS_MtW9hM', 'photo-1652363722833-509b3aac287b', 'Personne poussant des haltères', 'Michael DeMoya', 'demoya'),
  push_up: U('7C_Ri-7kyXc', 'photo-1714646442330-9068099f5521', 'Femme en pompes au sol', 'Vitaly Gariev', 'silverkblack'),
  pike_push_up: U('qlid9Lys8r0', 'photo-1731341400836-baaa5535b8d5', 'Homme en pompes en salle', 'Gard Pro', 'gardpro'),
  overhead_press: U('uQ9CSV9eJYw', 'photo-1532384661798-58b53a4fbe37', 'Homme tenant un haltère au niveau des épaules', 'Alora Griffiths', 'aloragriffiths'),
  db_shoulder_press: U('uQ9CSV9eJYw', 'photo-1532384661798-58b53a4fbe37', 'Homme au développé épaules haltère', 'Alora Griffiths', 'aloragriffiths'),
  db_row: U('k95uqdEe8R4', 'photo-1537289150563-b7f10eee353b', 'Femme tenant un haltère', 'Samantha Gades', 'srosinger3997'),
  pull_up: U('ug_onUKP99Q', 'photo-1516208962313-9d183d94f577', 'Femme en traction aux anneaux', 'GMB Fitness', 'gmb'),
  lat_pulldown: U('ug_onUKP99Q', 'photo-1516208962313-9d183d94f577', 'Femme en traction aux anneaux', 'GMB Fitness', 'gmb'),
  band_pulldown: U('ug_onUKP99Q', 'photo-1516208962313-9d183d94f577', 'Femme en traction aux anneaux', 'GMB Fitness', 'gmb'),
  lateral_raise: U('GBdtqvnCArw', 'photo-1598575522694-d55ada5e48f4', 'Homme en élévation d’épaules', 'Gordon Cowie', 'gcowie'),
  biceps_curl: U('FP7cfYPPUKM', 'photo-1583454110551-21f2fa2afe61', 'Personne en curl haltère', 'Anastase Maragos', 'visualsbyroyalz'),
};

export const SITE_PHOTOS = {
  heroWoman: U('h4i9G-de7Po', 'photo-1541534741688-6078c6bfb5c5', 'Femme en musculation, salle de quartier', 'John Arano', 'johnarano'),
  heroMan: U('aclkvEMIfL8', 'photo-1584863231364-2edc166de576', 'Homme en entraînement, débardeur orange', 'Anastase Maragos', 'visualsbyroyalz'),
  portraitDark: U('A9UonVi-cwk', 'photo-1668260920944-ec171ceb8633', 'Homme debout dans une salle sombre', 'Arthur Edelmans', 'arthur_edelmans'),
  boxing: U('Rp00MLjjCkI', 'photo-1633956287950-4a482f0356c8', 'Jeune homme en shadow-boxing dans un club de boxe', 'Metin Ozer', 'metinozer'),
  jollofFish: U('PqG32DYCTM8', 'photo-1665332195309-9d75071138f0', 'Riz jollof, poisson grillé et légumes frais', 'Keesha’s Kitchen', 'keeshasskitchen'),
  yassa: U('eaSIzdS8pv0', 'photo-1665400808116-f0e6339b7e9a', 'Poulet yassa sénégalais sur une table', 'Keesha’s Kitchen', 'keeshasskitchen'),
  jollofChicken: U('woC24wGXsQ8', 'photo-1664992960082-0ea299a9c53e', 'Riz jollof et brochettes de poulet', 'Keesha’s Kitchen', 'keeshasskitchen'),
  salmonBowl: U('KPDbRyFOTnE', 'photo-1547592180-85f173990554', 'Saumon et quinoa', 'Ella Olsson', 'ellaolsson'),
  veggieBowl: U('IGfIGP5ONV0', 'photo-1512621776951-a57141f2eefd', 'Bol de salade composée', 'Anna Pelzer', 'annapelzer'),
  eggsPlate: U('jUPOXXRNdcA', 'photo-1490645935967-10de6ba17061', 'Œuf poché et légumes', 'Brooke Lark', 'brookelark'),
  walk: U('NDeFhC_ZdRQ', 'photo-1736327786427-6582dc87b518', 'Coureur dans une rue au petit matin', 'Solar', 'solared'),
  sleep: U('k1gJ1x8e81o', 'photo-1758273239813-cecda76c6c19', 'Jeune femme dormant paisiblement', 'Vitaly Gariev', 'silverkblack'),
  rack: U('gzeTjGu3b_k', 'photo-1558611848-73f7eb4001a1', 'Barre sur un rack, salle éclairée par le soleil', 'Jelmer Assink', 'jelmerassink'),
  kettlebell: U('0tQLfwcr5-M', 'photo-1706029831387-fd8bc3d27d01', 'Femme avec une kettlebell', 'Ambitious Studio | Rick Barrett', 'weareambitious'),
  squatCoach: U('qbktVctZKL4', 'photo-1758875568582-ec8a4229c2b0', 'Femme au squat barre avec son coach', 'Vitaly Gariev', 'silverkblack'),
} as const;

/** Photo de repas selon la cuisine principale (en-tête des cartes de repas). */
export function mealPhotoFor(culture: string, kind: 'breakfast' | 'main' | 'snack'): Photo {
  if (kind === 'breakfast') return SITE_PHOTOS.eggsPlate;
  if (kind === 'snack') return SITE_PHOTOS.veggieBowl;
  if (culture === 'west_africa') return SITE_PHOTOS.jollofFish;
  return SITE_PHOTOS.salmonBowl;
}
