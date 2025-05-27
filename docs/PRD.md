Product Requirements Document: Perspective
Perspective – Product Requirements Document (v2)
Last updated: 2025 05 26
 
1. Executive Summary
Perspective is a multi platform training application that integrates live news exposure, interactive reasoning drills, and a personal "Echo Score" coach to help users escape echo chambers and build real cognitive flexibility. The new v2 vision positions Perspective as the single daily habit loop that:
•	Surfaces diverse, real world content (e.g., left / center / right coverage of the same headline, or opposing op eds).
•	Guides users through short, structured reflection or debate exercises that convert passive reading into active reasoning.
•	Quantifies growth with Echo Score 2.0 – a transparent, multi factor metric that blends content diversity, reasoning skill, and consistency.
•	Personalizes and adapts the journey based on individual blind spots, learning pace, and interests.
•	Builds community and accountability through opt in challenges, safe cross viewpoint conversations, and public progress badges.
Combined, these pillars differentiate Perspective from news aggregators (which lack training loops) and logic games (which lack real world context).
 
2. Problem Statement & Opportunity
Polarization and information silos continue to rise, while existing solutions attack only fragments of the issue:
Segment	What they do well	Key gaps
News bias visualizers (Ground News, AllSides)	Great comparative coverage UI	No skill training, no personal metric, limited habit design
Critical thinking micro apps (Reasonal, Spot the Fallacy)	Fun, gamified drills	Abstract content, no link to user's media diet
AI debate tools	On demand sparring partner	Scattered UX, lack curriculum or progress tracking
Academic visualizations (Ad Fontes chart, Blue Feed/Red Feed)	Striking awareness	One off demos, no daily engagement
Opportunity – unify the best of each category into a coherent, habit forming product that both measures and improves open mindedness.
 
3. Value Proposition & Differentiators
1.	Content ↔ Reflection Loop – Every news card is paired with an interactive prompt (quiz, counter argument, or synthesis task) so users apply new perspectives instantly.
2.	Echo Score 2.0 – Personal, gamified index that tracks diversity of exposure, reasoning accuracy, switching speed, and longitudinal improvement.
3.	Daily 5 Minute Habit – Rotating challenge types + streaks + push cues = low friction, high retention.
4.	Breadth of Cognitive Training – Logical fallacies, data literacy, moral reasoning, bias detection – all surfaced in current events wrappers.
5.	Adaptive Personalization Engine – Onboarding bias quiz + ongoing behavior signals drive per user curation and difficulty scaling.
6.	Safe Social Layer – Optional micro debates, community challenges, and anonymized benchmarking, with AI + human moderation.
7.	Radical Transparency – Open methodology for bias ratings, Echo Score formula, and AI guard rails builds user trust.
8.	Cross Platform Footprint – Native mobile (Swift / Kotlin) and lightweight browser extension to analyze users' organic feeds.
 
4. Target Users (unchanged)**
•	Lifelong Learners / Ambitious Professionals – want sharper decision making.
•	Cognitive Fitness Enthusiasts – treat mental agility like the gym.
•	Self Improvement Advocates – holistic growth seekers.
 
5. Core Product Principles
1.	Real world relevance – start from live content, not sterile puzzles.
2.	Micro over macro – single, digestible challenge each day beats long courses.
3.	Evidence & transparency first – show users why each exercise helps.
4.	Positive friction – design prompts that gently force perspective switching.
 
6. Feature Set & Phased Road map
6.1 Minimum Viable Product (3 months)
Theme	Features
Core Loop	• Bias balanced daily headline feed
• Dual perspective exercise engine (arrange seeded arguments → short reflection)	
• Echo Score 2.0 (Exposure % + Completion + Accuracy)	
• Dashboard with score trend & streak meter	
Infrastructure	Native iOS & Android clients • NodeJS / PostgreSQL backend • Content CMS • Authentication & privacy controls
6.2 Version 1.0 "Reflection" (+4 months)
•	Adaptive curation using bias profile & performance.
•	Echo Score component weights for Improvement & Variety.
•	Expanded exercise types – AI debate coach, data visual mis reads, ethical dilemma swaps.
•	Progress visualisation 2.0 – factor breakdown, next best action tips.
•	Landing site + explainer video for public launch.
6.3 Version 1.1 "Community" (post launch)
•	Micro debate rooms with AI mediation & 3 turn limit.
•	Weekly cohort challenges (e.g., "Read 5 opposite bias articles").
•	User generated scenarios with tiered moderation.
•	Browser extension to score outside reading & auto log Echo points.
•	Gamified badges & seasonal leader boards.
6.4 Longer Term
•	Hyper personalised "Training Plans".
•	Org/Ed dashboards & API licensing.
•	Health / productivity integrations (Apple Health, calendar hooks).
 
7. Echo Score 2.0 (Algorithm Sketch)
ΔScore = (w₁·Diversity) + (w₂·Accuracy) + (w₃·Switch Speed) + (w₄·Consistency) + (w₅·Improvement)
•	Diversity = normalised Gini index of ideological range read last 7 days.
•	Accuracy = correct answers / total in structured quizzes.
•	Switch Speed = median time to answer after perspective toggle.
•	Consistency = rolling 14 day active ratio.
•	Improvement = slope of Accuracy & Switch Speed over 30 day window.
Weights are stored server side and tunable via A/B tests; users see a transparent breakdown.
 
8. Engagement System
•	Daily push at personalized time of high attention.
•	Streak & XP bars tied to Echo Score gains.
•	Dynamic challenge rotation (Mon = Bias Swap, Tue = Logic Puzzle, …).
•	"Perspective Win" micro journals offered after synthesis tasks to reinforce reflection.
 
9. Trust & Safety
•	Bias source ratings licensed from AllSides / Ad Fontes + internal advisory board.
•	Echo Score formula published; users can export raw activity data.
•	AI outputs passed through moderation & toxicity filters; community features are opt in and anonymized by default.
 
10. Technology & Platform Strategy
•	Native mobile (Swift UI / Jetpack Compose) for performant, gesture rich exercises.
•	Browser extension (Manifest V3, React) shares auth/session with mobile for feed scoring.
•	Scalable backend – NodeJS + GraphQL + PostgreSQL; Redis cache for Echo Score deltas.
•	Content pipeline – Hybrid of expert written, AI draft + human review, and community submissions.
 
11. Monetization Plan
Stage	Model	Rationale
Launch	Freemium – 3 challenges/week free; ads off; limited history	Lower barrier, drive adoption
v1.0	Pro Subscription US $6.99 / mo	Unlimited drills, full history, AI debate coach, advanced insights
v1.1	Team/Edu licenses	Dashboard, cohort analytics, custom content
Future	Grants / Data insights API (anonymized)	Support research & impact measurement
 
12. Success Metrics
•	Product: 7 day retention ≥ 30 %, avg session ≥ 5 min, weekly Echo Score +5 pts.
•	Business: Free→Pro conversion ≥ 7 %, churn < 3%/mo.
•	Impact: Mean Diversity sub score +20 % after 60 days; self reported perspective taking ↑.
 
13. Key Risks & Mitigations (Δ since v1)
Risk	Mitigation
Personal bias detection feels invasive	Start with quiz only baseline; extension strictly opt in; transparent data controls
Content moderation at scale	Phased community rollout; layered AI + human review; restricted vocab filters
Retention drop off after novelty	Rotate challenge types; introduce weekly themes; leverage social accountability
Subscription resistance vs. free competitors	Clearly position integrated value; generous free tier; student discounts
 
14. Timeline Snapshot
Month	Milestone
0 3	MVP internal alpha (iOS, Android)
4	Closed beta (100 users) • Echo Score 2.0 live
5	Public launch V1.0 + landing page + video
7	v1.1 Community update + browser extension
12	Org/Edu offering + personalized plans

15. Visual Identity & Design Language
Perspective's brand system—based on overlapping geometric shapes and a cool to warm blue violet gradient—must be reflected across product UI, marketing, and data viz.
Asset	Usage Guidance
Primary Logo	Full logo appears on splash screen, login, marketing. Maintain 24 px minimum clear space; never recolor shapes.
App Icon	iOS / Android 1024 × 1024 source; fits Material 3 adaptive icon mask with 8 px pad.
Background Pattern	Subtle header/footer texture at ≤ 8 % opacity. Avoid busy overlap behind body text.
Data Viz Palette	Teal #00C2CC, Indigo #3554FF, Magenta #9747FF, Violet #5C2DFF. Map to categorical series in charts; Echo Score progress uses Indigo → Violet gradient.
Micro Illustrations	Thin line (2 dp) geometric glyphs for empty states and feature call outs. Follow Material 3 icon size 24 dp grid.
Photography Style	High contrast B&W portraits with 30 % gradient overlay matching brand gradient for hero imagery.
Typography	Headlines: Humanist sans "HF Lexa"  weight 600. Body: Neutral grotesque "Inter"  weight 400. Line height 1.4 em; comply with Material 3 type scale.

 
Appendices
* Detailed wireframes (see Figma link – WIP)
* Algorithm change log & weight tables
* Competitive feature matrix

