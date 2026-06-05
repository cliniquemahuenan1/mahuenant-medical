-- ============================================================
-- SCHÉMA SUPABASE — Clinique Médicale Mahuénan
-- Copiez-collez ce script dans l'éditeur SQL de Supabase
-- ============================================================

-- Table des médecins / utilisateurs
CREATE TABLE IF NOT EXISTS medecins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  specialite TEXT DEFAULT 'Médecine générale',
  role TEXT DEFAULT 'medecin', -- 'medecin' | 'admin'
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des patients
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_dossier TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  sexe TEXT,
  telephone TEXT,
  adresse TEXT,
  profession TEXT,
  groupe_sanguin TEXT,
  -- Antécédents
  atcd_medicaux TEXT,
  atcd_chirurgicaux TEXT,
  atcd_familiaux TEXT,
  allergies TEXT,
  -- Statut
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Numéro dossier auto-incrémenté
CREATE SEQUENCE IF NOT EXISTS dossier_seq START 1000;
CREATE OR REPLACE FUNCTION set_numero_dossier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_dossier IS NULL THEN
    NEW.numero_dossier := 'MHN-' || LPAD(nextval('dossier_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_numero_dossier
  BEFORE INSERT ON patients
  FOR EACH ROW EXECUTE FUNCTION set_numero_dossier();

-- Table des consultations
CREATE TABLE IF NOT EXISTS consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  medecin_id UUID REFERENCES medecins(id),
  medecin_nom TEXT,
  specialite TEXT DEFAULT 'Médecine générale',
  date_consultation TIMESTAMPTZ DEFAULT now(),
  -- Constantes vitales
  temperature NUMERIC(4,1),
  tension_systolique INTEGER,
  tension_diastolique INTEGER,
  frequence_cardiaque INTEGER,
  frequence_respiratoire INTEGER,
  spo2 NUMERIC(4,1),
  poids NUMERIC(5,1),
  taille INTEGER,
  imc NUMERIC(4,1),
  -- Clinique
  motif TEXT,
  symptomes JSONB DEFAULT '[]',
  inspection TEXT,
  auscultation TEXT,
  autres_signes TEXT,
  -- Champs spécialisés (JSONB flexible)
  donnees_specialite JSONB DEFAULT '{}',
  -- Résultats IA
  diagnostic_ia TEXT,
  bilan_recommande TEXT,
  orientation_therapeutique TEXT,
  alertes TEXT,
  -- Prescriptions
  prescriptions TEXT,
  examens_demandes TEXT,
  notes_medecin TEXT,
  -- Suivi
  statut TEXT DEFAULT 'en_cours', -- 'en_cours' | 'cloture' | 'suivi'
  prochain_rdv DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des ordonnances
CREATE TABLE IF NOT EXISTS ordonnances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  medecin_id UUID REFERENCES medecins(id),
  medicaments JSONB DEFAULT '[]',
  instructions TEXT,
  validite_jours INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des examens paracliniques
CREATE TABLE IF NOT EXISTS examens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type_examen TEXT, -- 'biologique' | 'radiologique' | 'autre'
  nom_examen TEXT,
  resultat TEXT,
  valeur_normale TEXT,
  interpretation TEXT,
  date_examen DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes pour performances
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_medecin ON consultations(medecin_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date_consultation DESC);
CREATE INDEX IF NOT EXISTS idx_patients_nom ON patients(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_patients_numero ON patients(numero_dossier);

-- Row Level Security (RLS) - tous les médecins authentifiés voient tout
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordonnances ENABLE ROW LEVEL SECURITY;
ALTER TABLE examens ENABLE ROW LEVEL SECURITY;
ALTER TABLE medecins ENABLE ROW LEVEL SECURITY;

-- Politique : tout utilisateur authentifié peut lire/écrire
CREATE POLICY "Authenticated users full access" ON patients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON consultations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON ordonnances FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON examens FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON medecins FOR ALL USING (auth.role() = 'authenticated');

-- Vue utile : dernière consultation par patient
CREATE OR REPLACE VIEW v_patients_resume AS
SELECT 
  p.*,
  COUNT(c.id) as nb_consultations,
  MAX(c.date_consultation) as derniere_consultation,
  (SELECT c2.medecin_nom FROM consultations c2 WHERE c2.patient_id = p.id ORDER BY c2.date_consultation DESC LIMIT 1) as dernier_medecin
FROM patients p
LEFT JOIN consultations c ON c.patient_id = p.id
GROUP BY p.id;
