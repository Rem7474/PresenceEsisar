import { config } from './config.js';

export class MailError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'MailError';
    this.status = status;
  }
}

/**
 * Authentifie l'étudiant auprès de l'API SOAP de Zimbra et récupère un token d'authentification.
 */
export const authenticateZimbra = async (email, password, { baseUrl = config.zimbra.url } = {}) => {
  const soapUrl = `${baseUrl}/service/soap`;
  const payload = {
    Header: {
      context: {
        _jsns: 'urn:zimbra'
      }
    },
    Body: {
      AuthRequest: {
        _jsns: 'urn:zimbraAccount',
        account: {
          _content: email,
          by: 'name'
        },
        password: {
          _content: password
        }
      }
    }
  };

  let response;
  try {
    response = await fetch(soapUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000)
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new MailError('Le serveur de messagerie a mis trop de temps à répondre.', 504);
    }
    throw new MailError('Serveur de messagerie injoignable, réessayez plus tard.', 502);
  }

  const data = await response.json().catch(() => null);

  if (response.status === 401 || response.status === 403) {
    throw new MailError('Identifiant ou mot de passe de messagerie incorrect.', 401);
  }

  if (data?.Body?.Fault) {
    const fault = data.Body.Fault;
    const errorCode = fault.Detail?.Error?.Code ?? '';
    const faultReason = fault.Reason?.Text ?? '';

    if (
      errorCode === 'account.AUTH_FAILED' ||
      faultReason.toLowerCase().includes('auth') ||
      faultReason.toLowerCase().includes('credential')
    ) {
      throw new MailError('Identifiant ou mot de passe de messagerie incorrect.', 401);
    }

    throw new MailError(`Échec d'authentification Zimbra : ${faultReason || 'erreur de connexion'}`, 502);
  }

  const authToken = data?.Body?.AuthResponse?.authToken?.[0]?._content;
  if (!authToken) {
    throw new MailError("Jeton d'authentification introuvable dans la réponse de la messagerie.", 502);
  }

  return authToken;
};

/**
 * Téléverse la pièce jointe sur le FileUploadServlet de Zimbra pour obtenir un AID (Attachment ID).
 */
export const uploadZimbraAttachment = async (
  authToken,
  { filename, content, mimeType = 'application/pdf', baseUrl = config.zimbra.url } = {}
) => {
  const uploadUrl = `${baseUrl}/service/upload?fmt=raw`;
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: mimeType }), filename);

  let response;
  try {
    response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Cookie: `ZM_AUTH_TOKEN=${authToken}`
      },
      body: formData,
      signal: AbortSignal.timeout(30_000)
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new MailError('Le téléversement de la pièce jointe a expiré.', 504);
    }
    throw new MailError('Serveur de messagerie injoignable lors du téléversement.', 502);
  }

  const rawText = (await response.text()).trim();

  // Format retourné par fmt=raw : 200,'null','<aid>'
  const parts = rawText.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
  if (parts[0] === '200' && parts[2]) {
    return parts[2];
  }

  const match = rawText.match(/200\s*,\s*[^,]+\s*,\s*['"]?([^'",\s]+)['"]?/);
  if (match?.[1]) {
    return match[1];
  }

  console.error('Réponse téléversement Zimbra inattendue :', response.status, rawText);
  throw new MailError("Échec du téléversement de l'attestation sur le serveur de messagerie.", 502);
};

/**
 * Envoie le mail via SendMsgRequest en attachant la pièce jointe préalablement téléversée.
 */
export const sendZimbraMail = async (
  authToken,
  { to, cc, subject, bodyText, aid, baseUrl = config.zimbra.url } = {}
) => {
  const soapUrl = `${baseUrl}/service/soap`;
  const recipients = [{ t: 't', a: to }];
  if (cc && cc !== to) {
    recipients.push({ t: 'c', a: cc });
  }

  const sendPayload = {
    Header: {
      context: {
        _jsns: 'urn:zimbra',
        authToken: {
          _content: authToken
        }
      }
    },
    Body: {
      SendMsgRequest: {
        _jsns: 'urn:zimbraMail',
        m: {
          e: recipients,
          su: { _content: subject },
          mp: [
            {
              ct: 'text/plain',
              content: { _content: bodyText }
            }
          ],
          attach: {
            aid
          }
        }
      }
    }
  };

  let response;
  try {
    response = await fetch(soapUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(sendPayload),
      signal: AbortSignal.timeout(30_000)
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new MailError("L'envoi de l'e-mail a expiré.", 504);
    }
    throw new MailError("Serveur de messagerie injoignable lors de l'envoi.", 502);
  }

  const data = await response.json().catch(() => null);

  if (data?.Body?.Fault) {
    const reason = data.Body.Fault.Reason?.Text || "Erreur lors de l'envoi";
    console.error('Échec SendMsg Zimbra :', data.Body.Fault);
    throw new MailError(`Échec de l'envoi du mail via Zimbra : ${reason}`, 502);
  }

  if (!response.ok || !data?.Body?.SendMsgResponse) {
    console.error('Réponse SendMsg inattendue :', response.status, data);
    throw new MailError("Échec de la distribution de l'e-mail par le serveur de messagerie.", 502);
  }

  return true;
};

/**
 * Orchestrateur complet pour envoyer l'attestation de présence :
 * 1. Authentification de l'étudiant
 * 2. Téléversement de l'attestation
 * 3. Envoi du courriel avec le fichier en pièce jointe
 */
export const sendPresenceEmail = async ({
  name,
  email,
  password,
  filename,
  subject,
  content,
  cc = true,
  mimeType = 'application/pdf',
  baseUrl = config.zimbra.url
}) => {
  const cleanName = name.replace(/["\r\n]/g, '').trim();
  const mailSubject = (
    subject ||
    (filename ? filename.replace(/\.[^.]+$/, '') : `Attestation présence P2027 - ${cleanName}`)
  ).trim();

  const bodyText = `Bonjour,\n\nVeuillez trouver ci-joint l'attestation de présence de ${cleanName}.\n\nÉtudiant : ${cleanName} (${email})\nFichier : ${filename}\n\nCordialement`;

  // 1. Authentification
  const authToken = await authenticateZimbra(email, password, { baseUrl });

  // 2. Téléversement de la pièce jointe
  const aid = await uploadZimbraAttachment(authToken, {
    filename,
    content,
    mimeType,
    baseUrl
  });

  // 3. Expédition du mail
  await sendZimbraMail(authToken, {
    to: config.recipient,
    cc: cc ? (typeof cc === 'string' ? cc : email) : undefined,
    subject: mailSubject,
    bodyText,
    aid,
    baseUrl
  });
};
