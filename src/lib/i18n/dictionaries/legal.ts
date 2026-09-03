import type { Locale } from '../locales';

// Chrome/navigation strings around the legal pages (app/legal/privacy,
// app/legal/terms) — translated like the rest of the app. The legal BODY
// text itself is deliberately NOT translated here: it's placeholder/
// template content that needs a real lawyer's review before launch (see
// the disclaimer banner), and translating a legal document five ways
// before it's even been reviewed once risks five different translation
// errors instead of one. It's written in English, the template's
// canonical language, with a clear on-page notice saying so.
//
// t() only does plain string interpolation (see I18nProvider.tsx), not
// embedded JSX — so the small "you agree to the Terms and Privacy Policy"
// links near checkout/signup are built from separate composable keys
// (lead-in phrase + inline link labels with correct articles/gender per
// language + "and") rather than one sentence with placeholders.
export const legal: Record<Locale, Record<string, string>> = {
  es: {
    'legal.backLink': 'Volver',
    'legal.disclaimerBanner':
      'Este es un documento de plantilla/marcador de posición, no asesoramiento legal. Debe ser revisado por un abogado antes de un lanzamiento real. Se muestra en inglés, el idioma original de la plantilla.',
    'legal.lastUpdated': 'Última actualización',
    'legal.privacy.eyebrow': 'Legal',
    'legal.privacy.title': 'Política de privacidad',
    'legal.terms.eyebrow': 'Legal',
    'legal.terms.title': 'Términos del servicio',
    'legal.footer.privacyLink': 'Privacidad',
    'legal.footer.termsLink': 'Términos',
    'legal.agreementLeadIn': 'Al continuar aceptas',
    'legal.agreementLeadInRegister': 'Al crear una cuenta aceptas',
    'legal.inlineTermsLink': 'los Términos del Servicio',
    'legal.inlinePrivacyLink': 'la Política de Privacidad',
    'legal.and': 'y',
  },
  en: {
    'legal.backLink': 'Back',
    'legal.disclaimerBanner':
      'This is placeholder/template content, not legal advice. It should be reviewed by a lawyer before a real launch.',
    'legal.lastUpdated': 'Last updated',
    'legal.privacy.eyebrow': 'Legal',
    'legal.privacy.title': 'Privacy Policy',
    'legal.terms.eyebrow': 'Legal',
    'legal.terms.title': 'Terms of Service',
    'legal.footer.privacyLink': 'Privacy',
    'legal.footer.termsLink': 'Terms',
    'legal.agreementLeadIn': 'By continuing you agree to',
    'legal.agreementLeadInRegister': 'By creating an account you agree to',
    'legal.inlineTermsLink': 'the Terms of Service',
    'legal.inlinePrivacyLink': 'the Privacy Policy',
    'legal.and': 'and',
  },
  pt: {
    'legal.backLink': 'Voltar',
    'legal.disclaimerBanner':
      'Este é um documento de modelo/marcador de posição, não aconselhamento jurídico. Deve ser revisto por um advogado antes de um lançamento real. É apresentado em inglês, o idioma original do modelo.',
    'legal.lastUpdated': 'Última atualização',
    'legal.privacy.eyebrow': 'Legal',
    'legal.privacy.title': 'Política de privacidade',
    'legal.terms.eyebrow': 'Legal',
    'legal.terms.title': 'Termos de serviço',
    'legal.footer.privacyLink': 'Privacidade',
    'legal.footer.termsLink': 'Termos',
    'legal.agreementLeadIn': 'Ao continuar, aceita',
    'legal.agreementLeadInRegister': 'Ao criar uma conta, aceita',
    'legal.inlineTermsLink': 'os Termos de Serviço',
    'legal.inlinePrivacyLink': 'a Política de Privacidade',
    'legal.and': 'e',
  },
  de: {
    'legal.backLink': 'Zurück',
    'legal.disclaimerBanner':
      'Dies ist ein Platzhalter-/Vorlagendokument, keine Rechtsberatung. Es sollte vor einem echten Start von einem Anwalt geprüft werden. Es wird auf Englisch angezeigt, der Originalsprache der Vorlage.',
    'legal.lastUpdated': 'Zuletzt aktualisiert',
    'legal.privacy.eyebrow': 'Rechtliches',
    'legal.privacy.title': 'Datenschutzerklärung',
    'legal.terms.eyebrow': 'Rechtliches',
    'legal.terms.title': 'Nutzungsbedingungen',
    'legal.footer.privacyLink': 'Datenschutz',
    'legal.footer.termsLink': 'Bedingungen',
    'legal.agreementLeadIn': 'Mit dem Fortfahren akzeptierst du',
    'legal.agreementLeadInRegister': 'Mit der Kontoerstellung akzeptierst du',
    'legal.inlineTermsLink': 'die Nutzungsbedingungen',
    'legal.inlinePrivacyLink': 'die Datenschutzerklärung',
    'legal.and': 'und',
  },
  fr: {
    'legal.backLink': 'Retour',
    'legal.disclaimerBanner':
      "Ceci est un document de modèle/espace réservé, pas un conseil juridique. Il doit être examiné par un avocat avant un lancement réel. Il est affiché en anglais, la langue d'origine du modèle.",
    'legal.lastUpdated': 'Dernière mise à jour',
    'legal.privacy.eyebrow': 'Mentions légales',
    'legal.privacy.title': 'Politique de confidentialité',
    'legal.terms.eyebrow': 'Mentions légales',
    'legal.terms.title': "Conditions d'utilisation",
    'legal.footer.privacyLink': 'Confidentialité',
    'legal.footer.termsLink': 'Conditions',
    'legal.agreementLeadIn': 'En continuant, vous acceptez',
    'legal.agreementLeadInRegister': 'En créant un compte, vous acceptez',
    'legal.inlineTermsLink': "les Conditions d'Utilisation",
    'legal.inlinePrivacyLink': 'la Politique de Confidentialité',
    'legal.and': 'et',
  },
};
