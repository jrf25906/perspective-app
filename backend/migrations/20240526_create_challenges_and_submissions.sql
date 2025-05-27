CREATE TABLE challenges (
  id SERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_id VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_challenge_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id INTEGER REFERENCES challenges(id),
  option_id VARCHAR(10) NOT NULL,
  correct BOOLEAN,
  submitted_at TIMESTAMP DEFAULT NOW()
);