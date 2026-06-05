import { ANTHROPIC_API_KEY } from './supabase.js'

export async function runDiagnosticIA(data, specialite) {
  const { patient, constantes, clinique, specialiteData } = data

  const age = patient.date_naissance
    ? Math.floor((Date.now() - new Date(patient.date_naissance)) / (1000*60*60*24*365.25))
    : null

  const imc = constantes.poids && constantes.taille
    ? (constantes.poids / ((constantes.taille/100)**2)).toFixed(1)
    : null

  let contextSpecialite = ''

  if (specialite === 'pediatrie' && specialiteData) {
    contextSpecialite = `
DONNÉES PÉDIATRIQUES :
- Alimentation : ${specialiteData.allaitement || 'NR'}
- Développement psychomoteur : ${specialiteData.developpement_psy || 'NR'}
- Vaccinations : ${specialiteData.vaccinations || 'NR'}
- Antécédents périnataux : ${specialiteData.antecedents_perinataux || 'NR'}`
  } else if (specialite === 'obstetrique' && specialiteData) {
    contextSpecialite = `
DONNÉES OBSTÉTRICALES :
- DDR : ${specialiteData.ddr || 'NR'} | Terme : ${specialiteData.terme || 'NR'}
- Gestité/Parité : G${specialiteData.gestite||'?'} P${specialiteData.parite||'?'}
- Mouvements fœtaux : ${specialiteData.mouvements_foetaux || 'NR'}
- Hauteur utérine : ${specialiteData.hb || 'NR'} cm | BCF : ${specialiteData.bcf || 'NR'} bpm
- Présentation : ${specialiteData.presentation || 'NR'}
- Col utérin : ${specialiteData.col_uterus || 'NR'}`
  } else if (specialite === 'cardiologie' && specialiteData) {
    contextSpecialite = `
DONNÉES CARDIOLOGIQUES :
- Facteurs de risque : ${(specialiteData.facteurs_risque||[]).join(', ') || 'Aucun'}
- Classe NYHA : ${specialiteData.score_nyha || 'NR'}
- ECG : ${specialiteData.ecg || 'NR'}
- Fraction d'éjection : ${specialiteData.fraction_ejection || 'NR'}%
- Pouls périphériques : ${specialiteData.pouls_periph || 'NR'}`
  } else if (specialite === 'neurologie' && specialiteData) {
    contextSpecialite = `
DONNÉES NEUROLOGIQUES :
- Glasgow : ${specialiteData.glasgow || 'NR'}/15 | MMSE : ${specialiteData.mmse || 'NR'}/30
- Nerfs crâniens : ${specialiteData.nerfs_craniens || 'NR'}
- Réflexes : ${specialiteData.reflexes || 'NR'}
- Coordination : ${specialiteData.coordination || 'NR'}
- Imagerie : ${specialiteData.imagerie_cerebrale || 'NR'}
- EEG : ${specialiteData.eeg || 'NR'}`
  } else if (specialite === 'diabetologie' && specialiteData) {
    contextSpecialite = `
DONNÉES DIABÉTOLOGIQUES :
- Type de diabète : ${specialiteData.type_diabete || 'NR'} — depuis ${specialiteData.annee_diagnostic || 'NR'}
- Glycémie à jeun : ${specialiteData.glycemie_jeun || 'NR'} g/L | HbA1c : ${specialiteData.hba1c || 'NR'}%
- Traitement antidiabétique : ${specialiteData.traitement_diabete || 'NR'}
- Complications connues : ${(specialiteData.complications||[]).join(', ') || 'Aucune'}
- Fond d'œil : ${specialiteData.fond_oeil || 'NR'}`
  }

  const systemPrompt = `Tu es un médecin clinicien expérimenté, spécialisé en ${specialite === 'generale' ? 'médecine générale' : specialite}. 
Tu travailles dans le contexte de l'Afrique de l'Ouest (Bénin). Tiens compte des pathologies endémiques locales (paludisme, fièvre typhoïde, méningite, tuberculose, infections parasitaires, etc.).
Sois précis, cliniquement rigoureux, et adapte tes recommandations aux ressources disponibles en milieu africain.
Réponds uniquement en français.`

  const userPrompt = `Voici les données d'un patient. Réalise une analyse clinique structurée.

PATIENT :
- Nom : ${patient.prenom || ''} ${patient.nom || ''}
- Âge : ${age ? age + ' ans' : 'NR'} | Sexe : ${patient.sexe || 'NR'}
- Profession : ${patient.profession || 'NR'}
- Groupe sanguin : ${patient.groupe_sanguin || 'NR'}

ANTÉCÉDENTS :
- Médicaux : ${patient.atcd_medicaux || 'Aucun'}
- Chirurgicaux : ${patient.atcd_chirurgicaux || 'Aucun'}
- Familiaux : ${patient.atcd_familiaux || 'Aucun'}
- Allergies : ${patient.allergies || 'Aucune'}
- Traitements en cours : ${clinique.traitements || 'Aucun'}

CONSTANTES VITALES :
- Température : ${constantes.temperature || 'NR'}°C
- TA : ${constantes.tension_systolique || 'NR'}/${constantes.tension_diastolique || 'NR'} mmHg
- FC : ${constantes.frequence_cardiaque || 'NR'} bpm | FR : ${constantes.frequence_respiratoire || 'NR'}/min
- SpO2 : ${constantes.spo2 || 'NR'}% | IMC : ${imc || 'NR'}
- Poids : ${constantes.poids || 'NR'} kg | Taille : ${constantes.taille || 'NR'} cm
${contextSpecialite}

MOTIF DE CONSULTATION :
${clinique.motif || 'Non renseigné'}

SYMPTÔMES :
${clinique.symptomes?.length > 0 ? clinique.symptomes.join(', ') : 'Non renseignés'}

EXAMEN CLINIQUE :
- Inspection générale : ${clinique.inspection || 'NR'}
- Auscultation / Palpation : ${clinique.auscultation || 'NR'}
- Autres signes : ${clinique.autres_signes || 'NR'}

---

Réponds EXACTEMENT avec ce format (garde les titres en majuscules et les emojis) :

🩺 ORIENTATION DIAGNOSTIQUE :
[2 à 4 diagnostics probables par ordre décroissant de probabilité. Pour chaque diagnostic : nom, probabilité estimée, arguments cliniques. Signale toute urgence médicale.]

🔬 BILAN PARACLINIQUE :
[Examens biologiques, radiologiques, fonctionnels à demander. Précise lesquels sont urgents (U) vs différables (D).]

💊 ORIENTATION THÉRAPEUTIQUE :
[Traitement symptomatique et étiologique. Médicaments avec posologies, durée. Mesures non médicamenteuses.]

⚠️ ALERTES ET SUIVI :
[Signes d'alarme. Critères d'hospitalisation ou de référence. Délai de réévaluation. Éducation thérapeutique.]`

  const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY

  const response = await fetch('/.netlify/functions/anthropic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  })

  if (!response.ok) throw new Error('Erreur API Anthropic')
  const result = await response.json()
  const text = result.content?.[0]?.text || ''

  // Parse sections
  const sections = {}
  const keys = [
    { key: 'diagnostic', pattern: /🩺\s*ORIENTATION DIAGNOSTIQUE\s*:([\s\S]*?)(?=🔬|$)/i },
    { key: 'bilan', pattern: /🔬\s*BILAN PARACLINIQUE\s*:([\s\S]*?)(?=💊|$)/i },
    { key: 'therapeutique', pattern: /💊\s*ORIENTATION THÉRAPEUTIQUE\s*:([\s\S]*?)(?=⚠️|$)/i },
    { key: 'alertes', pattern: /⚠️\s*ALERTES ET SUIVI\s*:([\s\S]*?)$/i },
  ]
  keys.forEach(({ key, pattern }) => {
    const m = text.match(pattern)
    sections[key] = m ? m[1].trim() : ''
  })
  sections.raw = text

  return sections
}
