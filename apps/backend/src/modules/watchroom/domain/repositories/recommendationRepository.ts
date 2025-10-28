import type { Recommendation } from '../types/recommendation.ts';

export interface CreateRecommendationData {
  watchroomId: string;
  seriesTmdbId: number;
  justification: string;
}

export interface RecommendationRepository {
  create(data: CreateRecommendationData): Promise<Recommendation>;
  findByWatchroomId(watchroomId: string): Promise<Recommendation[]>;
  delete(recommendationId: string): Promise<void>;
  deleteAllByWatchroomId(watchroomId: string): Promise<void>;
  findOne(recommendationId: string): Promise<Recommendation | null>;
}
