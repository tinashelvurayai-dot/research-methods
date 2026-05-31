
-- ============== TABLES ==============
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cards_topic ON public.cards(topic_id, order_index);

CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  access_code TEXT UNIQUE,
  notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_access_requests_status ON public.access_requests(status, created_at DESC);

CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  access_code TEXT NOT NULL UNIQUE,
  banned BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_users_code ON public.app_users(access_code);

CREATE TABLE public.user_sessions (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON public.user_sessions(user_id);

CREATE TABLE public.card_progress (
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'seen' CHECK (status IN ('seen','known','review')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, card_id)
);

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','responded','closed')),
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.agent_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Research Methods Agent',
  contact TEXT NOT NULL DEFAULT '+1 234 567 8900',
  notes TEXT
);

CREATE TABLE public.pricing_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  individual_price NUMERIC NOT NULL DEFAULT 5,
  group_price NUMERIC NOT NULL DEFAULT 8
);

CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============== RLS (deny-all; server fns use service role) ==============
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.topics, public.cards, public.access_requests, public.app_users,
  public.user_sessions, public.card_progress, public.support_tickets,
  public.agent_settings, public.pricing_settings, public.admin_users
  TO service_role;

-- ============== SEEDS ==============
INSERT INTO public.agent_settings (id, name, contact) VALUES (1, 'Research Methods Agent', '+1 234 567 8900')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.pricing_settings (id, individual_price, group_price) VALUES (1, 5, 8)
  ON CONFLICT (id) DO NOTHING;

-- 12 topics
INSERT INTO public.topics (slug, name, description, order_index) VALUES
  ('foundations',          'Foundations of Research',                 'Core definitions, paradigms, and the nature of inquiry.',          1),
  ('design',               'Research Design & Strategy',              'Choosing between experimental, survey, case study, and more.',     2),
  ('literature',           'Literature Review',                       'Searching, appraising, and synthesising prior work.',              3),
  ('sampling',             'Sampling Methods',                        'Probability vs non-probability sampling and sample size.',         4),
  ('collection',           'Data Collection Tools',                   'Questionnaires, interviews, observations, and instruments.',       5),
  ('qualitative',          'Qualitative Data Analysis',               'Thematic, content, narrative, and grounded theory analysis.',      6),
  ('quantitative',         'Quantitative Analysis & Statistics',      'Descriptive and inferential statistics for research.',             7),
  ('hypothesis',           'Hypothesis Testing & Inference',          'Null/alternative hypotheses, p-values, and test selection.',       8),
  ('ethics',               'Research Ethics & Integrity',             'Consent, confidentiality, plagiarism, and IRB principles.',        9),
  ('proposals',            'Writing Research Proposals',              'Structuring a clear, fundable research proposal.',                10),
  ('reports',              'Writing Research Reports & Papers',       'IMRaD structure, citations, and academic style.',                 11),
  ('mixed',                'Mixed Methods & Advanced Topics',         'Triangulation, mixed designs, and emerging methodologies.',       12);

-- Demo user with permanent access code
INSERT INTO public.app_users (full_name, email, whatsapp, access_code)
VALUES ('Demo Student', 'demo@research-methods.app', '+10000000000', 'DEMO-1234-5678');

-- Cards (6 per topic = 72)
DO $$
DECLARE t RECORD;
BEGIN
-- Helper: insert via per-topic blocks below
END $$;

WITH t AS (SELECT id FROM public.topics WHERE slug='foundations')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('What is research?','A systematic and organised process of investigating a problem in order to discover, interpret, or revise facts, theories, or applications. It follows a planned methodology, uses evidence, and aims to produce new knowledge or solve a defined problem.','easy',1),
 ('Distinguish between basic and applied research.','Basic research seeks to expand fundamental knowledge without immediate practical use, while applied research addresses specific, real-world problems with the aim of producing usable solutions for industry, policy, or practice.','easy',2),
 ('Define a research paradigm and name the main ones.','A research paradigm is a worldview that guides the assumptions and methods of a study. The main paradigms are positivism (objective, quantitative), interpretivism (subjective meaning, qualitative), pragmatism (problem-driven, mixed), and critical realism.','medium',3),
 ('What is the difference between ontology and epistemology?','Ontology concerns the nature of reality (what exists), while epistemology concerns the nature and justification of knowledge (how we know what we know). Together they shape methodological choices.','medium',4),
 ('Explain inductive vs deductive reasoning in research.','Deductive reasoning starts from a general theory and tests specific hypotheses derived from it. Inductive reasoning starts from specific observations and builds up to broader generalisations or theories.','medium',5),
 ('What characterises a good research problem?','It is researchable, clearly stated, original or significant, feasible within available resources, ethically acceptable, and contributes to theory or practice.','hard',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='design')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('What is a research design?','The overall plan that specifies how a study will be conducted, including the strategy, methods of data collection, sampling, and analysis used to answer the research questions.','easy',1),
 ('Compare cross-sectional and longitudinal designs.','Cross-sectional studies collect data at a single point in time across a population, while longitudinal studies collect data from the same units repeatedly over time, allowing analysis of change.','medium',2),
 ('When is a case study design appropriate?','When the researcher seeks an in-depth understanding of a contemporary phenomenon within its real-life context, especially when the boundaries between phenomenon and context are unclear.','medium',3),
 ('Define experimental research and its key requirement.','Experimental research investigates causal relationships by manipulating one or more independent variables and observing the effect on a dependent variable. Its key requirement is random assignment of subjects to conditions.','medium',4),
 ('What is a quasi-experimental design?','A design that resembles an experiment but lacks random assignment to groups. Comparison groups exist, but participants are assigned based on existing characteristics or natural exposure.','hard',5),
 ('Differentiate exploratory, descriptive, and explanatory studies.','Exploratory studies investigate poorly understood problems, descriptive studies portray characteristics of a population or phenomenon accurately, and explanatory studies seek causal relationships between variables.','medium',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='literature')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('Define a literature review.','A critical, structured analysis of existing scholarly work on a topic that identifies what is known, what is contested, and what gaps remain, providing the foundation and justification for new research.','easy',1),
 ('Name three purposes of a literature review.','1. To establish the theoretical and empirical context of the study. 2. To identify gaps, contradictions, or unanswered questions. 3. To justify the chosen research questions and methodology.','easy',2),
 ('Distinguish primary, secondary, and tertiary sources.','Primary sources report original research (journal articles, theses). Secondary sources interpret or summarise primary work (review papers, textbooks). Tertiary sources compile and organise existing knowledge (encyclopedias, bibliographies).','medium',3),
 ('What is a systematic literature review?','A structured review that follows an explicit, reproducible protocol to identify, appraise, and synthesise all relevant studies on a focused question, minimising bias through transparent inclusion criteria and search strategy.','hard',4),
 ('List criteria for critically appraising a source.','Authority of the author, currency of the publication, relevance to the research question, methodological rigour, theoretical contribution, and source of funding or potential bias.','medium',5),
 ('What is a conceptual framework?','A diagram or narrative that maps the key concepts, variables, and proposed relationships in a study, derived from theory and prior literature, that guides data collection and analysis.','hard',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='sampling')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('Distinguish population and sample.','A population is the entire set of units to which the researcher wishes to generalise. A sample is a subset of that population from which data are actually collected.','easy',1),
 ('What is probability sampling? Give examples.','Sampling methods in which every member of the population has a known, non-zero probability of selection. Examples: simple random, systematic, stratified, and cluster sampling.','medium',2),
 ('Define stratified random sampling and when to use it.','The population is divided into homogeneous subgroups (strata) and random samples are drawn from each stratum. It is used when subgroup comparisons matter or when subgroups vary widely on the variable of interest.','medium',3),
 ('Explain non-probability sampling with examples.','Sampling where selection probabilities are unknown. Examples include convenience, purposive, quota, and snowball sampling. Common in qualitative or exploratory studies where statistical generalisation is not the goal.','medium',4),
 ('State the basic formula for sample size for a proportion.','For a large population, $n = \\dfrac{Z^2 \\cdot p (1 - p)}{e^2}$ where $Z$ is the standard normal value for the confidence level, $p$ is the estimated proportion, and $e$ is the margin of error.','hard',5),
 ('What is sampling error?','The difference between a sample statistic and the true population parameter, arising because only a subset of the population was studied. It decreases as sample size increases.','medium',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='collection')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('Compare structured and unstructured interviews.','Structured interviews use a fixed set of standardised questions to ensure comparability across respondents. Unstructured interviews are open-ended, conversational, and explore topics in depth as they emerge.','easy',1),
 ('List advantages of self-administered questionnaires.','They are inexpensive, can reach geographically dispersed respondents, provide anonymity that may improve honesty on sensitive topics, and produce data that are easy to standardise and analyse.','easy',2),
 ('Distinguish open-ended and closed-ended questions.','Closed-ended questions provide pre-defined response options producing quantifiable data. Open-ended questions allow respondents to answer in their own words, producing richer but harder-to-code data.','medium',3),
 ('What is a Likert scale and what does it measure?','An ordinal scale (typically 5 or 7 points) that captures the degree of agreement or attitude towards a statement, e.g. from strongly disagree to strongly agree. It measures perceptions or attitudes.','medium',4),
 ('Differentiate participant and non-participant observation.','In participant observation the researcher takes part in the activities of the group being studied. In non-participant observation the researcher remains an outsider and only records behaviour without engaging.','medium',5),
 ('Explain reliability vs validity of an instrument.','Reliability is the consistency of the measure (does it produce the same result on repetition). Validity is the accuracy of the measure (does it actually measure what it claims to measure).','hard',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='qualitative')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('What is qualitative data analysis?','The non-numerical interpretation of data such as text, audio, or images to identify patterns, themes, and meanings that explain participants experiences or contexts.','easy',1),
 ('Outline the steps of thematic analysis.','1. Familiarisation with the data. 2. Generating initial codes. 3. Searching for themes. 4. Reviewing themes. 5. Defining and naming themes. 6. Producing the report.','medium',2),
 ('What is coding in qualitative research?','The process of labelling segments of data with short descriptive tags that summarise meaning, allowing data to be sorted, compared, and grouped into categories or themes.','medium',3),
 ('Describe content analysis.','A systematic technique for analysing the manifest or latent content of communication by counting and interpreting the frequency and context of specific words, themes, or concepts.','medium',4),
 ('What is grounded theory?','A qualitative approach in which theory is generated inductively from data through iterative coding, constant comparison, and theoretical sampling until categories are saturated.','hard',5),
 ('Define trustworthiness in qualitative research.','The qualitative equivalent of validity and reliability, established through credibility, transferability, dependability, and confirmability, as proposed by Lincoln and Guba.','hard',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='quantitative')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('Distinguish descriptive and inferential statistics.','Descriptive statistics summarise and describe the features of a dataset (mean, median, standard deviation). Inferential statistics use sample data to draw conclusions about the wider population.','easy',1),
 ('Give the formula for the arithmetic mean.','$\\bar{x} = \\dfrac{1}{n}\\sum_{i=1}^{n} x_i$ where $x_i$ are the observations and $n$ is the sample size.','easy',2),
 ('Define variance and standard deviation.','Variance measures the average squared deviation from the mean: $s^2 = \\dfrac{1}{n-1}\\sum_{i=1}^{n}(x_i - \\bar{x})^2$. The standard deviation is its square root, $s = \\sqrt{s^2}$, in the original units.','medium',3),
 ('What are the four levels of measurement?','Nominal (categories without order), ordinal (ordered categories), interval (ordered with equal intervals, no true zero), and ratio (interval with a true zero, allowing ratios).','medium',4),
 ('Define the Pearson correlation coefficient.','A measure of the strength and direction of a linear relationship between two interval/ratio variables: $r = \\dfrac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum (x_i - \\bar{x})^2 \\sum (y_i - \\bar{y})^2}}$. Values range from $-1$ to $+1$.','hard',5),
 ('State the simple linear regression model.','$y_i = \\beta_0 + \\beta_1 x_i + \\varepsilon_i$ where $\\beta_0$ is the intercept, $\\beta_1$ the slope, and $\\varepsilon_i$ the random error assumed to be normally distributed with mean zero.','hard',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='hypothesis')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('Define null and alternative hypotheses.','The null hypothesis $H_0$ states there is no effect or no difference in the population. The alternative hypothesis $H_1$ states there is an effect or a difference. Tests are designed to assess evidence against $H_0$.','easy',1),
 ('What does a p-value represent?','The probability of obtaining a test statistic at least as extreme as the observed one, assuming the null hypothesis is true. A small p-value indicates evidence against $H_0$.','medium',2),
 ('Distinguish Type I and Type II errors.','A Type I error rejects a true null hypothesis (false positive) with probability $\\alpha$. A Type II error fails to reject a false null hypothesis (false negative) with probability $\\beta$. Power equals $1 - \\beta$.','medium',3),
 ('When is a t-test appropriate?','When comparing means of one or two groups on a continuous variable that is approximately normally distributed, with unknown population variance. Use independent-samples, paired-samples, or one-sample variants as appropriate.','medium',4),
 ('What does ANOVA test?','Analysis of Variance tests whether the means of three or more groups differ significantly. The F-statistic compares between-group variance to within-group variance.','hard',5),
 ('When should chi-square be used?','To test associations between two categorical variables, or goodness-of-fit between observed and expected frequencies. Requires sufficient expected counts (typically at least 5) per cell.','hard',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='ethics')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('What is informed consent?','A process by which prospective participants are given clear information about a study purpose, procedures, risks, and benefits, and voluntarily agree to take part without coercion. Consent must be documented and revocable.','easy',1),
 ('Explain confidentiality vs anonymity.','Confidentiality means the researcher knows who participants are but does not disclose their identity. Anonymity means no one, including the researcher, can link responses to specific individuals.','easy',2),
 ('Define plagiarism in academic research.','Presenting another persons words, ideas, data, or work as ones own without proper acknowledgement. It includes copy-paste, paraphrasing without citation, and self-plagiarism of prior work.','medium',3),
 ('What is the role of an Institutional Review Board (IRB)?','An independent committee that reviews research proposals to ensure participants rights and welfare are protected, balancing scientific merit against ethical risks before approving the study.','medium',4),
 ('List the principles of the Belmont Report.','Respect for persons (autonomy and informed consent), beneficence (maximise benefits and minimise harms), and justice (fair distribution of research burdens and benefits).','hard',5),
 ('What are the risks of falsification and fabrication?','Falsification manipulates research materials or data. Fabrication invents data or results. Both are forms of research misconduct that undermine scientific integrity and can lead to retraction and sanctions.','hard',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='proposals')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('What is a research proposal?','A written plan that describes a proposed study, including its rationale, objectives, methodology, timeline, and budget, used to obtain approval or funding before research begins.','easy',1),
 ('List the typical sections of a proposal.','1. Title and abstract. 2. Introduction and background. 3. Problem statement. 4. Objectives and research questions. 5. Literature review. 6. Methodology. 7. Timeline. 8. Budget. 9. References.','easy',2),
 ('How should research objectives be written?','As clear, specific, measurable, achievable, relevant, and time-bound (SMART) statements that translate the broad research aim into concrete tasks the study will accomplish.','medium',3),
 ('What is the difference between aims and objectives?','The aim is the overall purpose or long-term goal of the research. Objectives are the specific, narrower steps the researcher will take to achieve that aim.','medium',4),
 ('Why include a timeline in a proposal?','To demonstrate feasibility, allocate tasks across the available period, and reassure reviewers or funders that the project can realistically be completed within the proposed timeframe.','medium',5),
 ('What does a methodology section justify?','Why each chosen design, sampling method, instrument, and analytical technique is appropriate for answering the research questions, with reference to relevant methodological literature.','hard',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='reports')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('What does the IMRaD structure stand for?','Introduction, Methods, Results, and Discussion. It is the standard structure for empirical research papers in the sciences and social sciences.','easy',1),
 ('What belongs in the Introduction section?','The background and context of the problem, the gap or question being addressed, the significance of the study, and a clear statement of the research aim or hypotheses.','easy',2),
 ('How should the Results section be presented?','Report findings objectively without interpretation, using tables and figures to summarise data, and reference each table or figure in the text in the order it appears.','medium',3),
 ('What is the purpose of the Discussion?','To interpret results in light of the research questions and prior literature, explain unexpected findings, acknowledge limitations, and suggest implications and directions for future research.','medium',4),
 ('Define a citation and a reference.','A citation is the in-text marker that credits the source of an idea or quotation. A reference is the full bibliographic entry at the end of the document that allows readers to locate the source.','medium',5),
 ('Name three common citation styles.','APA (American Psychological Association), MLA (Modern Language Association), and Harvard. Engineering and science also commonly use IEEE and Vancouver styles.','easy',6)
) AS q(question, answer, difficulty, idx);

WITH t AS (SELECT id FROM public.topics WHERE slug='mixed')
INSERT INTO public.cards (topic_id, question, answer, difficulty, order_index)
SELECT t.id, q.question, q.answer, q.difficulty, q.idx FROM t,
(VALUES
 ('Define mixed methods research.','An approach that combines quantitative and qualitative data collection and analysis within a single study or programme of inquiry to gain a more complete understanding of the phenomenon.','easy',1),
 ('Why use mixed methods?','To leverage the complementary strengths of quantitative breadth and qualitative depth, triangulate findings, explain unexpected quantitative results, or develop and validate instruments.','medium',2),
 ('Describe an explanatory sequential design.','A two-phase mixed methods design where quantitative data are collected and analysed first, then qualitative data are gathered to explain or expand on the quantitative results.','medium',3),
 ('What is triangulation?','The use of multiple methods, data sources, investigators, or theories to study the same phenomenon, strengthening the credibility and richness of the findings.','medium',4),
 ('Compare convergent and sequential mixed designs.','Convergent designs collect quantitative and qualitative data in parallel and compare results to corroborate or contrast findings. Sequential designs use one strand to inform the next, in a planned order.','hard',5),
 ('What is action research?','A participatory, cyclical approach in which researchers and practitioners collaborate to diagnose a problem, take action, evaluate outcomes, and refine practice, often within an organisational setting.','hard',6)
) AS q(question, answer, difficulty, idx);
