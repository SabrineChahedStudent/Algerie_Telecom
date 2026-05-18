import json
import urllib.request
import urllib.error
import time
from decouple import config

GEMINI_API_KEY = config('GEMINI_API_KEY', default='')

def run_hf_triage(service_name, issue_description, chat_history=''):
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'REPLACE_ME_WITH_YOUR_GEMINI_KEY':
        # Fallback if no key
        return {
            "reply": "Je suis désolé, je n'arrive pas à joindre le serveur IA (Clé API manquante). Souhaitez-vous que je soumette la réclamation ?",
            "is_resolved": False,
            "can_submit": True,
            "auto_submit": False
        }
        
    API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    
    system_prompt = """You are a highly empathetic, conversational, and precise virtual technical support agent for Algérie Télécom. You must act exactly like a real human agent talking to a customer.

Strict Guidelines:
1. Strict Language Consistency: EVERY SINGLE MESSAGE you send, from the very beginning of the conversation until the end, MUST be EXACTLY in the same language as the language in which the INITIAL complaint was submitted. Do NOT switch languages under any circumstances.
2. Brief Responses: Keep your replies extremely brief, conversational, and precise. Avoid long paragraphs.
3. Maximum 3 Solutions: You are allowed to suggest AT MOST 3 solutions for the client to try, ONE BY ONE. Suggest one step, ask the user to try it, and wait for their response. Do NOT give a long list of steps at once.
4. Ticket Submission: If the 3 suggested solutions did not work, stop suggesting solutions and immediately ask the client if they want to submit a ticket for an agent to contact them (translated into their language).
5. Nonsense & Out of Scope: If the client types random letters/gibberish (e.g., "jhkhkhk"), uses insults (e.g., "f u"), asks about unrelated topics, or writes something incomprehensible, you MUST immediately ABORT troubleshooting. Reply EXACTLY with the equivalent of "This is outside the scope" in the user's language. Do NOT apologize, do NOT suggest any solutions, and do NOT try to continue the troubleshooting if the input is nonsense.
6. Empathy & Tone: Express empathy briefly. Use a polite, human-like tone.
7. JSON Output: You MUST respond ONLY with a valid JSON object. No extra text. The JSON must contain exactly:
   - "reply" : (string) Your complete, short response to the client.
   - "is_resolved": (boolean) Set to true ONLY if the client confirms the problem is fully resolved.
   - "can_submit": (boolean) Set to true if the client says the solutions did not work and wants to submit a ticket (or after the 3 solutions failed).
   - "auto_submit": (boolean) Set to true ONLY if you asked the user if they want to submit a ticket, and they explicitly replied 'yes'.
   - "is_nonsense": (boolean) Set to true ONLY if you determined the user's input was nonsense, an insult, or out of scope.

Example 1:
User: Mon internet est très lent depuis ce matin.
Bot: { "reply": "Je suis désolé pour ces lenteurs. Pourrions-nous commencer par redémarrer votre modem ? Débranchez-le 30 secondes, rebranchez-le, et dites-moi si ça va mieux.", "is_resolved": false, "can_submit": false, "auto_submit": false, "is_nonsense": false }

Example 2:
User: It still doesn't work after restarting.
Bot: { "reply": "I'm sorry it didn't work. Let's try another step. Are you connected via Wi-Fi or with a cable?", "is_resolved": false, "can_submit": false, "auto_submit": false, "is_nonsense": false }

Example 3:
User: f u
Bot: { "reply": "This is outside the scope", "is_resolved": false, "can_submit": false, "auto_submit": false, "is_nonsense": true }

Example 4:
User: jhkhkhk
Bot: { "reply": "This is outside the scope", "is_resolved": false, "can_submit": false, "auto_submit": false, "is_nonsense": true }

Example 5:
Bot: These 3 solutions did not work. Would you like me to submit a ticket?
User: Yes please.
Bot: { "reply": "Your ticket is being submitted.", "is_resolved": false, "can_submit": true, "auto_submit": true, "is_nonsense": false }
"""

    prompt = f"Historique :\n{chat_history}\n\nClient (Service: {service_name}): {issue_description}\n\nRéponds UNIQUEMENT en JSON valide."

    payload = {
        "system_instruction": {
            "parts": {"text": system_prompt}
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }
    
    max_retries = 3
    base_delay = 2

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(API_URL, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json"})
            resp = urllib.request.urlopen(req, timeout=20)
            
            data = json.loads(resp.read().decode('utf-8'))
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Clean JSON markdown
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            elif text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            return json.loads(text.strip(), strict=False)
            
        except urllib.error.HTTPError as e:
            if e.code in [503, 429]:
                if attempt < max_retries - 1:
                    time.sleep(base_delay * (2 ** attempt))
                    continue
                else:
                    return {
                        "reply": "Nos serveurs IA sont actuellement très sollicités (forte demande). Veuillez réessayer dans quelques instants ou soumettre un ticket pour parler à un agent.",
                        "is_resolved": False,
                        "can_submit": True,
                        "auto_submit": False
                    }
            else:
                return {
                    "reply": "Une erreur de communication avec l'IA s'est produite. Veuillez réessayer plus tard ou soumettre un ticket.",
                    "is_resolved": False,
                    "can_submit": True,
                    "auto_submit": False
                }
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(base_delay * (2 ** attempt))
                continue
            return {
                "reply": "Erreur système lors de la connexion à l'IA. Souhaitez-vous transmettre le ticket aux agents ?",
                "is_resolved": False,
                "can_submit": True,
                "auto_submit": False
            }

def generer_resume_ia(historique_ia):
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'REPLACE_ME_WITH_YOUR_GEMINI_KEY':
        return "Résumé IA non disponible (Clé API manquante)."
        
    API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""Tu es un agent expert d'Algérie Télécom.
Voici l'historique complet d'une conversation entre un client et notre chatbot de triage initial.
Ton objectif est de rédiger un résumé clair, précis et professionnel de cette conversation pour l'agent de support technique qui va prendre en charge le ticket.

Le résumé doit inclure :
- Le problème principal rencontré par le client.
- Les solutions proposées par le chatbot et testées par le client.
- Le résultat de ces tests.
- Toute autre information pertinente donnée par le client.

Historique de la conversation :
{historique_ia}

Rédige uniquement le résumé, sans texte additionnel, en français.
"""

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }
    
    max_retries = 3
    base_delay = 2
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(API_URL, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json"})
            resp = urllib.request.urlopen(req, timeout=15)
            data = json.loads(resp.read().decode('utf-8'))
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return text.strip()
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                import time
                time.sleep(base_delay * (2 ** attempt))
                continue
            print(f"Erreur HTTP lors de la génération du résumé: {e}")
            break
        except Exception as e:
            print(f"Erreur lors de la génération du résumé: {e}")
            break
            
    return "Résumé IA non disponible en raison d'une erreur technique."

def generer_resume_escalade(historique_chat):
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'REPLACE_ME_WITH_YOUR_GEMINI_KEY':
        return "Résumé IA non disponible (Clé API manquante)."
        
    API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""Tu es un agent expert d'Algérie Télécom.
Voici l'historique complet d'une conversation entre un agent du helpdesk et un client.
Ton objectif est de rédiger un résumé clair, précis et professionnel de cette conversation pour l'agent technique (ou annexe) qui va prendre le relais suite à une escalade du ticket.

Le résumé doit inclure :
- Le problème initial.
- Les actions tentées par le helpdesk.
- Les réponses du client.
- La raison de l'escalade (si explicite ou déduite de l'échange).

Historique de la conversation :
{historique_chat}

Rédige uniquement le résumé, sans texte additionnel, en français.
"""

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }
    
    max_retries = 3
    base_delay = 2
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(API_URL, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json"})
            resp = urllib.request.urlopen(req, timeout=15)
            data = json.loads(resp.read().decode('utf-8'))
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return text.strip()
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries - 1:
                import time
                time.sleep(base_delay * (2 ** attempt))
                continue
            print(f"Erreur HTTP lors de la génération du résumé d'escalade: {e}")
            break
        except Exception as e:
            print(f"Erreur lors de la génération du résumé d'escalade: {e}")
            break
            
    return "Résumé IA non disponible en raison d'une erreur technique."












