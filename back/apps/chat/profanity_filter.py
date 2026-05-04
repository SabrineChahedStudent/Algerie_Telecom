"""
Filtre de mots inappropriés / insultes.
Supporte : Français, Anglais, Arabe, Darija (dialecte algérien).
Les mots détectés sont remplacés par des astérisques (***).
"""

import re

# ── Liste des mots interdits ──────────────────────────────────

MOTS_FRANCAIS = [
    # Insultes courantes
    'merde', 'putain', 'connard', 'connasse', 'salaud', 'salope',
    'enculé', 'enculer', 'nique', 'niquer', 'ntm', 'niqueur',
    'batard', 'bâtard', 'fdp', 'fils de pute', 'pute', 'prostituée',
    'bordel', 'foutre', 'enfoiré', 'abruti', 'débile', 'crétin',
    'crétine', 'imbécile', 'idiot', 'idiote', 'con', 'conne',
    'couille', 'couilles', 'bite', 'pénis', 'chier', 'chiotte',
    'emmerdeur', 'emmerdeuse', 'emmerder', 'dégueulasse', 'pouffiasse',
    'pétasse', 'garce', 'ordure', 'raclure', 'charogne', 'clochard',
    'trou du cul', 'trouduc', 'branleur', 'branleuse', 'branler',
    'pd', 'pédé', 'tapette', 'gouine', 'tarlouze',
    'ta gueule', 'ta mère', 'ferme ta gueule', 'ftg',
    'bouffon', 'bouffonne', 'tocard', 'tocarde', 'pignouf',
    'va te faire', 'casse toi', 'dégage',
]

MOTS_ANGLAIS = [
    'fuck', 'fucking', 'fucker', 'fucked', 'motherfucker', 'mf',
    'shit', 'shitty', 'bullshit', 'bitch', 'bitchy',
    'asshole', 'ass', 'bastard', 'damn', 'damned',
    'dick', 'dickhead', 'cock', 'cunt', 'pussy',
    'whore', 'slut', 'stfu', 'wtf', 'idiot', 'moron',
    'retard', 'retarded', 'dumbass', 'jackass',
    'nigga', 'nigger', 'fag', 'faggot',
    'piss', 'pissed', 'crap', 'suck', 'sucker',
    'shut up', 'screw you', 'go to hell',
]

MOTS_ARABE_DARIJA = [
    # Arabe standard + dialecte algérien/maghrébin
    'كلب', 'حمار', 'خنزير', 'شرموطة', 'قحبة', 'زنديق',
    'عاهرة', 'لعنة', 'منيوك', 'زبي', 'طبون', 'نعل',
    'تفو', 'كس', 'نيك', 'زب',
    # Translittéré (Darija en lettres latines)
    'kelb', 'hmar', 'hmara', 'zebi', 'zeb', 'zbi',
    'kahba', 'kahlouche', 'manyouk', 'manyok', 'maniouk',
    'nayek', 'nayak', 'nikmok', 'nik', 'nikta', 'niktamok',
    'taboun', 'tabbon', 'hashouma', 'khanzoura',
    'la3nat', 'laanate', 'tfou', 'tfo',
    'zamel', 'lhwa', 'mra dyal', 'weld el kahba',
    'weld lkahba', 'ould el kahba', 'ould lkahba',
    'bougnoule', 'sale arabe', 'sale noir',
    'halouf', 'khinzir', 'rajel zhar',
    'kol khara', 'sir tniek', 'sir t9awed',
    'wahd lkelb', 'wahd lhmar',
    'mok', 'yemak', 'bik', 'din mok', 'dinmok',
    'lmok', 'ya weld', 'ya bent',
    'tchouma', 'hchouma',
    'barra', 'sakker', 'rouh',
]

# ── Normalisation des lettres répétées ─────────────────────────

def _normalize(mot):
    """
    Réduit les lettres répétées à max 2 occurrences.
    fuuuuuuck → fuuck, merrrrde → merrde, etc.
    Ensuite Levenshtein fera le reste (fuuck → fuck, distance=1).
    """
    if not mot:
        return mot
    result = [mot[0]]
    for i in range(1, len(mot)):
        # Si le caractère est le même que les 1 précédents, on skip
        if mot[i] == mot[i-1] and (len(result) >= 2 and result[-1] == result[-2]):
            continue
        result.append(mot[i])
    return ''.join(result)


# ── Distance de Levenshtein ───────────────────────────────────

def _levenshtein(s1, s2):
    """Calcule la distance de Levenshtein entre deux chaînes."""
    if len(s1) < len(s2):
        return _levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


# ── Liste plate des mots interdits (pour Levenshtein) ─────────

_MOTS_LATIN = [w.lower() for w in MOTS_FRANCAIS + MOTS_ANGLAIS
               + [w for w in MOTS_ARABE_DARIJA if re.search(r'[a-zA-Z]', w)]
               if len(w) >= 4]  # Seulement les mots de 4+ lettres pour éviter les faux positifs

_MOTS_ARABE_ONLY = [w for w in MOTS_ARABE_DARIJA if not re.search(r'[a-zA-Z]', w)]


# ── Compilation du filtre ─────────────────────────────────────

def _build_patterns():
    """Construit les patterns regex pour chaque mot interdit."""
    all_words = MOTS_FRANCAIS + MOTS_ANGLAIS + MOTS_ARABE_DARIJA
    patterns = []
    for word in all_words:
        # Pour les mots en caractères latins, on ajoute des word boundaries
        # Pour les mots en arabe, on les matche directement
        if re.search(r'[a-zA-ZÀ-ÿ]', word):
            # Échapper les caractères spéciaux regex
            escaped = re.escape(word)
            # Permettre des espaces/tirets/points entre les lettres (anti-contournement)
            # Ex: "f.u.c.k" ou "f u c k"
            flexible = re.sub(r'(?<=\w)(?=\w)', r'[\\s.\\-_]*', escaped)
            pattern = re.compile(r'\b' + flexible + r'\b', re.IGNORECASE)
        else:
            # Mots en arabe ou caractères non-latins
            pattern = re.compile(re.escape(word), re.IGNORECASE)
        patterns.append((word, pattern))
    return patterns


_PATTERNS = _build_patterns()


def _check_levenshtein(mot):
    """
    Vérifie si un mot est proche d'un mot interdit via Levenshtein.
    Normalise d'abord les lettres répétées (fuuuuuck → fuuck).
    Seuil : distance 1 pour mots courts (4-5 lettres), distance 2 pour mots longs (6+).
    Retourne True si le mot est suspect.
    """
    mot_lower = mot.lower()
    if len(mot_lower) < 4:
        return False  # Trop court, risque de faux positifs (ex: "con" ≈ "bon")

    # Normaliser les lettres répétées : fuuuuuuck → fuuck
    mot_normalized = _normalize(mot_lower)

    for bad_word in _MOTS_LATIN:
        # Seuil adaptatif selon la longueur du mot
        seuil = 1 if len(bad_word) <= 5 else 2
        # Comparer avec le mot original ET le mot normalisé
        for candidate in (mot_lower, mot_normalized):
            if abs(len(candidate) - len(bad_word)) > seuil:
                continue
            distance = _levenshtein(candidate, bad_word)
            if distance <= seuil:
                return True
    return False


def censurer_message(texte):
    """
    Remplace les mots interdits par des astérisques.
    Utilise d'abord le matching exact (regex), puis Levenshtein pour les variantes.
    Retourne (texte_censuré, bool_censuré).
    """
    if not texte:
        return texte, False

    resultat = texte
    censuré = False

    # 1. Matching exact par regex
    for word, pattern in _PATTERNS:
        def remplacer(match):
            nonlocal censuré
            censuré = True
            return '*' * len(match.group())
        resultat = pattern.sub(remplacer, resultat)

    # 2. Matching par distance de Levenshtein (mots latins seulement)
    mots = re.findall(r'[a-zA-ZÀ-ÿ]{4,}', resultat)
    for mot in mots:
        if '*' in mot:
            continue  # Déjà censuré
        if _check_levenshtein(mot):
            censuré = True
            resultat = re.sub(r'\b' + re.escape(mot) + r'\b', '*' * len(mot), resultat)

    return resultat, censuré


def contient_insultes(texte):
    """Vérifie si un texte contient des mots interdits. Retourne True/False."""
    if not texte:
        return False
    for _, pattern in _PATTERNS:
        if pattern.search(texte):
            return True
    # Vérifier aussi par Levenshtein
    mots = re.findall(r'[a-zA-ZÀ-ÿ]{4,}', texte)
    for mot in mots:
        if _check_levenshtein(mot):
            return True
    return False

