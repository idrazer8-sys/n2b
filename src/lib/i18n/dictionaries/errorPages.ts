import type { Locale } from '../locales';

/**
 * App-wide error boundary and 404 page (app/error.tsx, app/not-found.tsx).
 * These render for any route that doesn't have its own more specific
 * error/loading UI, so copy here stays generic on purpose.
 */
export const errorPages: Record<Locale, Record<string, string>> = {
  es: {
    'errorPages.notFound.eyebrow': 'PÁGINA NO ENCONTRADA',
    'errorPages.notFound.title': 'Esta página no existe',
    'errorPages.notFound.body':
      'El enlace puede estar mal escrito o la página ya no está disponible.',
    'errorPages.notFound.homeLink': 'Volver al inicio',
    'errorPages.error.eyebrow': 'ALGO HA FALLADO',
    'errorPages.error.title': 'No hemos podido cargar esto',
    'errorPages.error.body':
      'Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.',
    'errorPages.error.retry': 'Reintentar',
    'errorPages.error.homeLink': 'Volver al inicio',
  },
  en: {
    'errorPages.notFound.eyebrow': 'PAGE NOT FOUND',
    'errorPages.notFound.title': "This page doesn't exist",
    'errorPages.notFound.body':
      'The link may be mistyped, or the page is no longer available.',
    'errorPages.notFound.homeLink': 'Back to home',
    'errorPages.error.eyebrow': 'SOMETHING WENT WRONG',
    'errorPages.error.title': "We couldn't load this",
    'errorPages.error.body':
      'An unexpected error occurred. You can try again or go back home.',
    'errorPages.error.retry': 'Try again',
    'errorPages.error.homeLink': 'Back to home',
  },
  pt: {
    'errorPages.notFound.eyebrow': 'PÁGINA NÃO ENCONTRADA',
    'errorPages.notFound.title': 'Esta página não existe',
    'errorPages.notFound.body':
      'O link pode estar incorreto ou a página não está mais disponível.',
    'errorPages.notFound.homeLink': 'Voltar ao início',
    'errorPages.error.eyebrow': 'ALGO DEU ERRADO',
    'errorPages.error.title': 'Não conseguimos carregar isto',
    'errorPages.error.body':
      'Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao início.',
    'errorPages.error.retry': 'Tentar novamente',
    'errorPages.error.homeLink': 'Voltar ao início',
  },
  de: {
    'errorPages.notFound.eyebrow': 'SEITE NICHT GEFUNDEN',
    'errorPages.notFound.title': 'Diese Seite gibt es nicht',
    'errorPages.notFound.body':
      'Der Link ist möglicherweise falsch oder die Seite ist nicht mehr verfügbar.',
    'errorPages.notFound.homeLink': 'Zurück zur Startseite',
    'errorPages.error.eyebrow': 'ETWAS IST SCHIEFGELAUFEN',
    'errorPages.error.title': 'Das konnten wir nicht laden',
    'errorPages.error.body':
      'Ein unerwarteter Fehler ist aufgetreten. Du kannst es erneut versuchen oder zur Startseite zurückkehren.',
    'errorPages.error.retry': 'Erneut versuchen',
    'errorPages.error.homeLink': 'Zurück zur Startseite',
  },
  fr: {
    'errorPages.notFound.eyebrow': 'PAGE INTROUVABLE',
    'errorPages.notFound.title': "Cette page n'existe pas",
    'errorPages.notFound.body':
      "Le lien est peut-être incorrect, ou la page n'est plus disponible.",
    'errorPages.notFound.homeLink': "Retour à l'accueil",
    'errorPages.error.eyebrow': "UNE ERREUR EST SURVENUE",
    'errorPages.error.title': "Impossible de charger cette page",
    'errorPages.error.body':
      "Une erreur inattendue s'est produite. Vous pouvez réessayer ou revenir à l'accueil.",
    'errorPages.error.retry': 'Réessayer',
    'errorPages.error.homeLink': "Retour à l'accueil",
  },
};
