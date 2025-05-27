export interface EchoScore {
  total_score: number;
  diversity_score: number;
  accuracy_score: number;
  switch_speed_score: number;
  consistency_score: number;
  improvement_score: number;
}

export interface EchoScoreHistory {
  id: number;
  user_id: number;
  total_score: number;
  diversity_score: number;
  accuracy_score: number;
  switch_speed_score: number;
  consistency_score: number;
  improvement_score: number;
  calculation_details: EchoScoreCalculationDetails;
  score_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface EchoScoreCalculationDetails {
  diversity_metrics: {
    gini_index: number;
    sources_read: string[];
    bias_range: number;
  };
  accuracy_metrics: {
    correct_answers: number;
    total_answers: number;
    recent_accuracy: number;
  };
  speed_metrics: {
    median_response_time: number;
    improvement_trend: number;
  };
  consistency_metrics: {
    active_days: number;
    total_days: number;
    streak_length: number;
  };
  improvement_metrics: {
    accuracy_slope: number;
    speed_slope: number;
    diversity_slope: number;
  };
} 