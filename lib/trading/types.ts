export type Confidence = "high" | "medium" | "low";

export interface ProductPublic {
  id: number;
  name: string;
  supplier_id: number;
  supplier_name: string;
  supplier_country: string;
  supplier_type: string | null;
  supplier_since: number | null;
  moq: number | null;
  moq_unit: string | null;
  price_display: string;
  price_source: string;
  image: string | null;
  images: string[];
  species: string;
  product_type: string;
  color: string | null;
  tags_source: string;
  tag_confidence: number | null;
  subcluster: number;
  certs: string[];
  specs: Record<string, string>;
}

export interface BuyerPublic {
  id: string;
  name: string;
  country: string;
  country_iso3: string;
  region: string;
  trade_bloc: string;
  n_products: number;
  price_band: (number | null)[];
  brand_tier: string;
  certs_required: string[];
  image: string | null;
  est_monthly_volume: number | null;
  subcluster?: number;
  subcluster_name?: string;
}

export interface Contribution {
  feature: string;
  block: string;
  value: number;
  weight: number;
  contribution: number;
  data_status?: string;
}

export interface MatchedProduct {
  id: number;
  name: string;
  image: string | null;
  sim: number;
}

export interface VisualEvidence {
  buyerImage: string | null;
  supplierImage: string | null;
  visualSim: number;
  source: string;
}

export interface Recommendation {
  productId: number;
  buyerId: string;
  score: number;
  calibratedConversion: number;
  calibrationNote: string;
  confidence: Confidence;
  confidenceDensity: number;
  rank?: number;
  breakdown: Record<string, number | null>;
  contributions: Contribution[];
  evidence: {
    matchedBuyerProducts: MatchedProduct[];
    matchedTokens: string[];
    visualEvidence: VisualEvidence | null;
    marketNotes: string[];
    moqNote: string | null;
  };
  tags: { species: string; productType: string; color: string | null; source: string; confidence: number | null };
  constraints: { passed: string[]; failed: string[]; policy: string[] };
  profit: {
    status: string;
    expected: null;
    formula: string;
    assumptions: Record<string, string>;
  };
  rankerVersion: string;
  labelSource: string;
  modelVersion: string;
  product: ProductPublic;
  buyer: BuyerPublic;
  in_batch_top10?: boolean;
}

export interface BuyerSummary extends BuyerPublic {
  top_match: { product_id: number; name: string; image: string | null } | null;
}

export interface ProductSummary {
  id: number;
  name: string;
  supplier_name: string;
  image: string | null;
  moq: number | null;
  moq_unit: string | null;
  price_display: string;
  species: string;
  product_type: string;
  subcluster: number;
  subcluster_name: string;
}

export interface WhyNot {
  product: ProductPublic;
  score: number;
  breakdown: Record<string, number | null>;
  reason: string;
  note: string;
}

export interface BuyerDetail {
  buyer: BuyerSummary;
  products: {
    id: number;
    name: string;
    image: string | null;
    price_usd: number | null;
    currency: string;
    species: string;
    product_type: string;
    color: string | null;
    merchant_category: string;
    top_supplier_matches: { product_id: number; name: string; image: string | null; sim: number }[];
  }[];
  recommendations: Recommendation[];
  why_not: WhyNot | null;
  batch_stale: boolean;
  config_hash: string;
}

export interface FeatureMeta {
  name: string;
  block: string;
  description: string;
  default_weight: number;
  data_status: "real" | "partial" | "stub";
}

export interface FeaturesGlobal {
  features: FeatureMeta[];
  global_importance: Record<string, number>;
  based_on: string;
  settings: Settings;
}

export interface Settings {
  weights: Record<string, number>;
  mmr_lambda: number;
  cap: number;
  cap_cluster: number;
  ranker: string;
  vision_enabled: boolean;
  alpha: number;
  beta: number;
}

export interface Metrics {
  variants: Record<string, { recall_at_10: number; ndcg_at_10: number; coverage: number; intra_list_diversity: number }>;
  notes: string[];
  generated_at: string;
}

export interface RegressionMeta {
  fitted: boolean;
  model?: string;
  target?: string;
  label_source?: string;
  n_pairs?: number;
  n_groups?: number;
  alpha?: number;
  r2_in_sample?: number;
  r2_grouped_cv?: number;
  cv_folds?: string;
  rmse?: number;
  mean_grade?: number;
  grade_distribution?: Record<string, number>;
  intercept?: number;
  coefficients?: Record<string, number>;
  trained_at?: string;
  serving?: string;
  honesty_note?: string;
}

export interface Health {
  ok: boolean;
  counts: Record<string, number>;
  vision: { pairs_with_visual: number; enabled: boolean };
  ranker: string;
  lgbm: { trained: boolean; reason?: string; label_source?: string; valid_ndcg_at_10?: number; shap_available?: boolean; honesty_note?: string };
  ridge: { fitted: boolean; r2_grouped_cv?: number; r2_in_sample?: number; alpha?: number };
  config_hash: string;
}