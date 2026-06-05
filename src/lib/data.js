export const SPECIALITES = [
  { id: 'generale', label: 'Médecine Générale', icon: 'ti-stethoscope', color: '#0a5c3c' },
  { id: 'pediatrie', label: 'Pédiatrie', icon: 'ti-baby-carriage', color: '#1a5fa8' },
  { id: 'obstetrique', label: 'Obstétrique / Gynécologie', icon: 'ti-heart', color: '#c0392b' },
  { id: 'cardiologie', label: 'Cardiologie', icon: 'ti-heartbeat', color: '#d4600a' },
  { id: 'neurologie', label: 'Neurologie', icon: 'ti-brain', color: '#6c3fa0' },
  { id: 'diabetologie', label: 'Diabétologie / Endocrinologie', icon: 'ti-droplet', color: '#c9901a' },
]

export const SYMPTOMES = {
  generaux: ["Fièvre","Frissons","Fatigue","Asthénie","Amaigrissement","Anorexie","Sueurs nocturnes","Malaise général","Céphalées","Vertiges","Œdèmes","Prurit","Pâleur"],
  digestifs: ["Nausées","Vomissements","Diarrhée","Constipation","Douleur abdominale","Ballonnements","Dysphagie","Méléna","Rectorragie","Ictère","Hépatomégalie","Épigastralgie","Pyrosis"],
  respiratoires: ["Toux sèche","Toux productive","Dyspnée","Douleur thoracique","Hémoptysie","Wheezing","Expectoration","Rhinorrhée","Congestion nasale","Épistaxis","Stridor","Tirage"],
  cardio: ["Palpitations","Douleur précordiale","Dyspnée d'effort","Orthopnée","Syncope","Lipothymie","Claudication","Tachycardie","Bradycardie"],
  neuro: ["Céphalées intenses","Convulsions","Troubles de conscience","Paresthésies","Paralysie","Raideur de nuque","Tremblements","Troubles du langage","Diplopie","Ataxie","Insomnie","Confusion"],
  musculo: ["Myalgies","Arthralgies","Arthrites","Lombalgies","Cervicalgies","Dorsalgies","Faiblesse musculaire","Crampes"],
  uro: ["Dysurie","Pollakiurie","Hématurie","Douleur lombaire","Brûlures mictionnelles","Urines troubles","Nycturie","Anurie","Rétention urinaire"],
  gyneco: ["Leucorrhées","Métrorragies","Ménorragies","Dysménorrhée","Dyspareunie","Aménorrhée","Douleur pelvienne","Prurit vulvaire"],
  peau: ["Éruption cutanée","Urticaire","Cicatrice suintante","Plaie","Ulcère","Pétéchies","Purpura","Œdème localisé"],
}

// Champs spécifiques par spécialité
export const CHAMPS_SPECIALITE = {
  pediatrie: [
    { id: 'age_gestationnel', label: 'Âge gestationnel à la naissance (SA)', type: 'number' },
    { id: 'poids_naissance', label: 'Poids de naissance (g)', type: 'number' },
    { id: 'allaitement', label: 'Mode d\'alimentation', type: 'select', options: ['Allaitement maternel','Allaitement artificiel','Mixte','Alimentation diversifiée'] },
    { id: 'vaccinations', label: 'Statut vaccinal', type: 'textarea' },
    { id: 'developpement_psy', label: 'Développement psychomoteur', type: 'textarea' },
    { id: 'courbe_croissance', label: 'Courbe de croissance (observations)', type: 'textarea' },
    { id: 'antecedents_perinataux', label: 'Antécédents périnataux', type: 'textarea' },
    { id: 'fratrie', label: 'Rang dans la fratrie', type: 'text' },
  ],
  obstetrique: [
    { id: 'ddr', label: 'Date des dernières règles (DDR)', type: 'date' },
    { id: 'terme', label: 'Terme (SA + jours)', type: 'text' },
    { id: 'gestite', label: 'Gestité (G)', type: 'number' },
    { id: 'parite', label: 'Parité (P)', type: 'number' },
    { id: 'fausse_couche', label: 'Fausses couches', type: 'number' },
    { id: 'acouchements_anterieurs', label: 'Accouchements antérieurs', type: 'textarea' },
    { id: 'mouvements_foetaux', label: 'Mouvements fœtaux', type: 'select', options: ['Présents normaux','Diminués','Absents','Non applicable'] },
    { id: 'hb', label: 'Hauteur utérine (cm)', type: 'number' },
    { id: 'bcf', label: 'Bruits du cœur fœtal (bpm)', type: 'number' },
    { id: 'presentation', label: 'Présentation fœtale', type: 'select', options: ['Céphalique','Siège','Transverse','Non évaluée'] },
    { id: 'col_uterus', label: 'État du col utérin', type: 'textarea' },
    { id: 'contraception', label: 'Contraception actuelle', type: 'text' },
    { id: 'derniere_mammo', label: 'Dernière mammographie', type: 'text' },
    { id: 'frottis_cervical', label: 'Dernier frottis cervico-vaginal', type: 'text' },
  ],
  cardiologie: [
    { id: 'facteurs_risque', label: 'Facteurs de risque cardiovasculaire', type: 'checkboxes', options: ['Tabagisme','HTA','Diabète','Hypercholestérolémie','Obésité','ATCD familial précoce','Sédentarité'] },
    { id: 'score_nyha', label: 'Classe NYHA', type: 'select', options: ['I — Aucune limitation','II — Limitation légère','III — Limitation importante','IV — Symptômes au repos'] },
    { id: 'ecg', label: 'ECG (résultats)', type: 'textarea' },
    { id: 'echo_cardio', label: 'Échocardiographie (résultats)', type: 'textarea' },
    { id: 'fraction_ejection', label: 'Fraction d\'éjection (%)', type: 'number' },
    { id: 'antecedents_cardio', label: 'Antécédents cardiologiques', type: 'textarea' },
    { id: 'pouls_periph', label: 'Pouls périphériques', type: 'textarea' },
  ],
  neurologie: [
    { id: 'glasgow', label: 'Score de Glasgow (/15)', type: 'number' },
    { id: 'mmse', label: 'Score MMSE (/30)', type: 'number' },
    { id: 'lateralite', label: 'Latéralité', type: 'select', options: ['Droitier','Gaucher','Ambidextre'] },
    { id: 'nerfs_craniens', label: 'Examen des nerfs crâniens', type: 'textarea' },
    { id: 'reflexes', label: 'Réflexes ostéo-tendineux', type: 'textarea' },
    { id: 'coordination', label: 'Coordination et équilibre', type: 'textarea' },
    { id: 'sensibilite', label: 'Examen de la sensibilité', type: 'textarea' },
    { id: 'imagerie_cerebrale', label: 'Imagerie cérébrale (résultats)', type: 'textarea' },
    { id: 'eeg', label: 'EEG (résultats)', type: 'textarea' },
  ],
  diabetologie: [
    { id: 'type_diabete', label: 'Type de diabète', type: 'select', options: ['Type 1','Type 2','Gestationnel','MODY','Secondaire','Non déterminé'] },
    { id: 'annee_diagnostic', label: 'Année du diagnostic', type: 'number' },
    { id: 'glycemie_jeun', label: 'Glycémie à jeun (g/L)', type: 'number' },
    { id: 'hba1c', label: 'HbA1c (%)', type: 'number' },
    { id: 'traitement_diabete', label: 'Traitement antidiabétique', type: 'textarea' },
    { id: 'complications', label: 'Complications connues', type: 'checkboxes', options: ['Rétinopathie','Néphropathie','Neuropathie périphérique','Pied diabétique','Artériopathie','Cardiopathie ischémique'] },
    { id: 'surveillance_glycemique', label: 'Surveillance glycémique (carnet)', type: 'textarea' },
    { id: 'bmi_objectif', label: 'Objectif glycémique HbA1c (%)', type: 'number' },
    { id: 'fond_oeil', label: 'Fond d\'œil (résultats)', type: 'textarea' },
  ],
  generale: []
}

export const GROUPES_SANGUINS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Inconnu']
