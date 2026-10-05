/**
 * RECOMP — Types du Body Recomposition Engine.
 * Tout est en unités SI : kg, cm, minutes, kcal, grammes.
 */

export type ISODate = string; // 'YYYY-MM-DD'

export type Sex = 'male' | 'female' | 'other';
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'gym' | 'home_basic' | 'home_none';
export type OccupationActivity = 'sedentary' | 'light' | 'active' | 'very_active';
export type AppMode = 'simple' | 'busy' | 'performance';
export type NutritionPrecision = 'precise' | 'simple';
export type FoodCulture =
  | 'west_africa'
  | 'europe'
  | 'maghreb'
  | 'south_asia'
  | 'east_asia'
  | 'latin_america'
  | 'middle_east';

export type Goal =
  | 'fat_loss'
  | 'muscle_gain'
  | 'recomposition'
  | 'athletic'
  | 'strength'
  | 'definition'
  | 'conditioning'
  | 'energy'
  | 'sleep'
  | 'health';

export type VisualGoal =
  | 'leaner'
  | 'athletic'
  | 'bigger'
  | 'defined'
  | 'flat_stomach'
  | 'wider_shoulders'
  | 'bigger_arms'
  | 'wider_back'
  | 'stronger_legs'
  | 'harmonious'
  | 'sporty';

export type FatStorageZone = 'abdomen' | 'hips' | 'thighs' | 'chest' | 'arms' | 'back' | 'face' | 'even';

export type BodyRegion = 'shoulder' | 'elbow' | 'wrist' | 'lower_back' | 'hip' | 'knee' | 'ankle' | 'neck';

export interface Limitation {
  region: BodyRegion;
  note?: string;
}

export interface RiskFlags {
  pregnant?: boolean;
  minor?: boolean;
  medicalHistory?: boolean;
  eatingDisorderHistory?: boolean;
}

export interface Consents {
  photoAiAnalysis: boolean;
  productImprovement: boolean;
  notifications: boolean;
  /** traitement des données de santé (art. 9 RGPD), consentement explicite */
  healthData?: boolean;
  /** horodatage ISO des consentements */
  consentedAt?: string;
}

export interface BehaviouralTraits {
  perfectionism?: boolean;
  allOrNothing?: boolean;
  emotionalEating?: boolean;
  lowMotivation?: boolean;
  decisionFatigue?: boolean;
  routineDifficulty?: boolean;
}

export interface Profile {
  id: string;
  createdAt: ISODate;
  displayName?: string;
  sex: Sex;
  age: number;
  heightCm: number;
  startWeightKg: number;
  level: TrainingLevel;
  yearsTraining: number;
  sessionsPerWeek: number;
  sessionMinutes: number;
  equipment: Equipment;
  occupation: OccupationActivity;
  workHoursPerWeek: number;
  stepsPerDay?: number;
  goals: Goal[];
  primaryGoal: Goal;
  visualGoals: VisualGoal[];
  fatStorage: FatStorageZone[];
  priorityStatement?: string;
  mode: AppMode;
  nutritionPrecision: NutritionPrecision;
  foodCultures: FoodCulture[];
  dietaryPreferences: string[]; // 'no_pork', 'vegetarian', 'halal', 'lactose_free'...
  allergies: string[];
  dislikedFoods: string[];
  limitations: Limitation[];
  risk: RiskFlags;
  consents: Consents;
  traits: BehaviouralTraits;
  /** Préférence de fenêtre alimentaire, facultative. */
  fastingWindow?: '12/12' | '14/10' | '16/8' | null;
  mealsPerDay: 3 | 4 | 5;
  trainingTimeOfDay: 'morning' | 'midday' | 'evening';
  /** Jours d'entraînement préférés 0=dimanche … 6=samedi */
  trainingDays: number[];
}

export interface Measurement {
  date: ISODate;
  weightKg?: number;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  shouldersCm?: number;
  armCm?: number;
  thighCm?: number;
  calfCm?: number;
  neckCm?: number;
  /** conditions de mesure respectées (à jeun, matin) */
  protocolOk?: boolean;
}

export interface PainReport {
  region: BodyRegion;
  severity: 1 | 2 | 3 | 4 | 5;
  unusual: boolean;
}

/** Échelles 1 (très bas) à 5 (très haut). */
export interface DailyCheckin {
  date: ISODate;
  energy: number;
  sleepHours: number;
  sleepQuality: number;
  bedTime?: string; // 'HH:MM'
  wakeTime?: string;
  nightWakings?: number;
  stress: number;
  soreness: number;
  motivation: number;
  hunger: number;
  mood: number;
  steps?: number;
  pain?: PainReport | null;
}

export interface SetLog {
  weightKg: number;
  reps: number;
  rir?: number;
}

export interface PerformanceLog {
  date: ISODate;
  exerciseId: string;
  sets: SetLog[];
}

export type ReadinessLevel = 'push' | 'normal' | 'light' | 'rest';

export interface WorkoutSession {
  id: string;
  date: ISODate;
  workoutDayId: string;
  planned: boolean;
  completed: boolean;
  durationMin?: number;
  readiness?: ReadinessLevel;
  perceivedEffort?: number; // 1-10
}

export interface MealLog {
  date: ISODate;
  /** mode simple : portions */
  proteinServings?: number;
  vegServings?: number;
  carbServings?: number;
  fatServings?: number;
  waterMl?: number;
  /** mode précis */
  kcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  flexMeal?: boolean;
}

export type LifeEventType =
  | 'restaurant'
  | 'travel'
  | 'busy_week'
  | 'birthday'
  | 'ramadan'
  | 'holiday'
  | 'no_gym'
  | 'illness';

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  startDate: ISODate;
  endDate: ISODate;
  note?: string;
}

export interface BodyPhotoMeta {
  id: string;
  date: ISODate;
  view: 'front' | 'side' | 'back';
  uri: string; // data URL (démo) ou chemin storage
  /** auto-évaluation de l'utilisateur, facultative */
  selfAssessment?: 'worse' | 'same' | 'better';
}

export interface CoachDecision {
  date: ISODate;
  summary: string;
  why: string;
  evidenceId?: EvidenceId;
}

/** Tout ce que le moteur a besoin de lire. */
export interface UserState {
  profile: Profile;
  measurements: Measurement[];
  checkins: DailyCheckin[];
  sessions: WorkoutSession[];
  performance: PerformanceLog[];
  meals: MealLog[];
  lifeEvents: LifeEvent[];
  photos: BodyPhotoMeta[];
  decisions: CoachDecision[];
  /** Coefficients appris (Personal Response Profile), bornés. */
  response?: PersonalResponseProfile;
}

export interface PersonalResponseProfile {
  /** -1 (mal) … +1 (bien) : tolérance au volume élevé */
  volumeTolerance: number;
  /** -1 … +1 : réponse au jeûne / fenêtre réduite */
  fastingTolerance: number;
  /** -1 … +1 : satiété avec apports riches en fibres/protéines */
  satietyResponse: number;
  /** -1 … +1 : sommeil après entraînement tardif */
  lateTrainingSleep: number;
  /** -1 … +1 : vitesse de récupération */
  recoverySpeed: number;
  updatedAt: ISODate;
}

// ---------- Evidence Layer ----------

export type EvidenceLevel = 'solid' | 'probable' | 'uncertain' | 'approach';

export type EvidenceId =
  | 'protein_intake'
  | 'deficit_rate'
  | 'calorie_cycling'
  | 'weight_noise'
  | 'waist_marker'
  | 'progressive_overload'
  | 'volume_hypertrophy'
  | 'double_progression'
  | 'deload'
  | 'protein_distribution'
  | 'anabolic_window'
  | 'carbs_around_training'
  | 'time_restricted_eating'
  | 'fiber'
  | 'hydration'
  | 'sleep_resistance_training'
  | 'sleep_and_fat_loss'
  | 'steps_neat'
  | 'flex_meal_adherence'
  | 'spot_reduction'
  | 'chrononutrition'
  | 'low_carb'
  | 'photo_bodyfat'
  | 'readiness_autoregulation'
  | 'recomposition_feasibility'
  | 'periodization'
  | 'diet_break'
  | 'training_frequency';

export interface EvidenceSource {
  ref: string;
  year: number;
  type: 'meta-analysis' | 'systematic-review' | 'rct' | 'guideline' | 'consensus' | 'narrative';
}

export interface Evidence {
  id: EvidenceId;
  level: EvidenceLevel;
  title: string;
  summary: string;
  whatWeDo: string;
  sources: EvidenceSource[];
}

export interface Explanation {
  context: string;
  logic: string;
  expectedBenefit: string;
  evidenceId: EvidenceId;
}

// ---------- Sorties ----------

export interface ScoreDriver {
  key: string;
  label: string;
  /** -1 … +1 */
  signal: number;
  weight: number;
  text: string;
}

export interface BodyCompositionScore {
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
  drivers: ScoreDriver[];
  headline: string;
}

export interface VitalityScore {
  score: number; // 0-10
  components: ScoreDriver[];
  headline: string;
}

export interface RecoveryScore {
  score: number; // 0-100
  readiness: ReadinessLevel;
  reasons: string[];
  suggestion: string;
}

export interface Trend {
  slopePerWeek: number;
  delta: number;
  first: number;
  last: number;
  points: number;
  direction: 'up' | 'down' | 'flat';
}
