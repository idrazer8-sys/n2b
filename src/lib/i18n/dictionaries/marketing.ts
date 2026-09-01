import type { Locale } from '../locales';

/**
 * Public marketing landing page: app/page.tsx.
 */
export const marketing: Record<Locale, Record<string, string>> = {
  es: {
    'marketing.nav.features': 'Características',
    'marketing.nav.pricing': 'Precios',
    'marketing.nav.login': 'Iniciar sesión',
    'marketing.nav.getStarted': 'Empezar gratis',

    'marketing.hero.eyebrow': 'Operaciones de restaurante automatizadas',
    'marketing.hero.headline': 'Restaurantes más inteligentes. Clientes más felices.',
    'marketing.hero.subheadline':
      'Escanea, pide y paga — sin descargar ninguna app. Configura tu carta en minutos y empieza a recibir pedidos hoy.',
    'marketing.hero.ctaPrimary': 'Empieza tu prueba gratis de 7 días',
    'marketing.hero.ctaSecondary': 'Ver cómo funciona',
    'marketing.hero.trustNote':
      'Prueba completa de 7 días. Cancela cuando quieras — sin letra pequeña.',

    'marketing.pain.eyebrow': 'El problema',
    'marketing.pain.headline': 'Cada minuto de espera es una mesa que se enfría.',
    'marketing.pain.body':
      'Las cartas de papel se desactualizan. Los camareros corren entre la sala y la cocina. Los pagos se demoran al final de la comida. N2B conecta cada paso — desde que el cliente escanea el código hasta que paga — en un solo sistema en tiempo real.',

    'marketing.features.eyebrow': 'Todo incluido',
    'marketing.features.headline': 'Un sistema, no un montón de parches.',
    'marketing.feature1.title': 'Pedido por QR y NFC',
    'marketing.feature1.body':
      'El cliente escanea el código de su mesa, ve la carta y pide desde su propio móvil. Sin descargar nada.',
    'marketing.feature2.title': 'Pagos con Stripe',
    'marketing.feature2.body':
      'Cobra online o en mesa. No cobramos comisión por pedido — el 100% de tus ingresos es tuyo.',
    'marketing.feature3.title': 'Cocina en tiempo real',
    'marketing.feature3.body':
      'Los pedidos llegan a cocina al instante. Sin tickets perdidos, sin gritar a través de la sala.',
    'marketing.feature4.title': 'Camareros coordinados',
    'marketing.feature4.body':
      'Cada camarero ve sus mesas asignadas, los pedidos listos para servir y los pagos pendientes en un solo panel.',
    'marketing.feature5.title': 'Analítica real',
    'marketing.feature5.body':
      'Ingresos, tiempos de servicio, tus mesas más activas. Decisiones basadas en datos, no en intuición.',
    'marketing.feature6.title': 'Carta en 5 idiomas',
    'marketing.feature6.body':
      'Español, inglés, portugués, alemán y francés — tus clientes internacionales piden en su idioma sin esfuerzo extra.',
    'marketing.feature7.title': 'Más reseñas en Google',
    'marketing.feature7.body':
      'Cada cliente que paga recibe automáticamente una invitación a dejar una reseña, en el momento justo.',

    'marketing.why.eyebrow': 'Por qué N2B',
    'marketing.why.headline': 'Diseñado para que probarlo no dé miedo.',
    'marketing.why1.title': 'Sin compromiso',
    'marketing.why1.body':
      '7 días de prueba completos. Si no es para ti, cancela en un clic — sin contratos ni letra pequeña.',
    'marketing.why2.title': 'Te quedas con el 100%',
    'marketing.why2.body':
      'A diferencia de otras plataformas, no cobramos comisión por pedido. Lo que vende tu restaurante es tuyo.',
    'marketing.why3.title': 'Listo en minutos',
    'marketing.why3.body':
      'Sin hardware nuevo, sin instalaciones. Crea tu carta, imprime tus códigos QR y empieza a recibir pedidos hoy mismo.',
    'marketing.why4.title': 'Pagos seguros',
    'marketing.why4.body':
      'Todos los cobros pasan por Stripe. Nunca almacenamos ni vemos los datos de la tarjeta de tus clientes.',

    'marketing.preview.eyebrow': 'Tu panel',
    'marketing.preview.headline': 'Todo tu restaurante, en una sola pantalla.',
    'marketing.preview.body':
      'Pedidos, mesas, personal y analítica — organizados y en tiempo real.',

    'marketing.qr.eyebrow': 'Escanea. Pide. Disfruta.',
    'marketing.qr.body':
      'Imprime un código QR único por mesa en segundos, directamente desde tu panel.',
    'marketing.qr.tableLabel': 'Mesa 12',

    'marketing.pricing.eyebrow': 'Precios',
    'marketing.pricing.headline': 'Un plan para cada tamaño de restaurante.',
    'marketing.pricing.subheadline':
      'Empieza con 7 días gratis en cualquier plan. Cambia o cancela cuando quieras.',

    'marketing.finalCta.headline': 'Automatiza hoy. Un restaurante mejor mañana.',
    'marketing.finalCta.body':
      'Únete a la nueva generación de restaurantes que gestionan pedidos, pagos y equipo desde un solo lugar.',
    'marketing.finalCta.cta': 'Empezar prueba gratis',

    'marketing.footer.tagline': 'Operaciones de restaurante automatizadas.',
    'marketing.footer.linkLogin': 'Iniciar sesión',
    'marketing.footer.linkRegister': 'Crear cuenta',
    'marketing.footer.copyright': '© 2026 N2B. Todos los derechos reservados.',
  },
  en: {
    'marketing.nav.features': 'Features',
    'marketing.nav.pricing': 'Pricing',
    'marketing.nav.login': 'Log in',
    'marketing.nav.getStarted': 'Get started free',

    'marketing.hero.eyebrow': 'Restaurant operations automated',
    'marketing.hero.headline': 'Smarter restaurants. Happier customers.',
    'marketing.hero.subheadline':
      'Scan, order, and pay — no app to download. Set up your menu in minutes and start taking orders today.',
    'marketing.hero.ctaPrimary': 'Start your 7-day free trial',
    'marketing.hero.ctaSecondary': 'See how it works',
    'marketing.hero.trustNote':
      'A full 7-day trial. Cancel anytime — no fine print.',

    'marketing.pain.eyebrow': 'The problem',
    'marketing.pain.headline': 'Every minute a table waits, the food gets colder.',
    'marketing.pain.body':
      'Paper menus go out of date. Waiters run back and forth between the floor and the kitchen. Payment drags on at the end of the meal. N2B connects every step — from the moment a customer scans the code to the moment they pay — in one real-time system.',

    'marketing.features.eyebrow': 'Everything included',
    'marketing.features.headline': 'One system, not a pile of patched-together tools.',
    'marketing.feature1.title': 'QR & NFC ordering',
    'marketing.feature1.body':
      'Customers scan their table\'s code, see the menu, and order from their own phone. Nothing to download.',
    'marketing.feature2.title': 'Payments with Stripe',
    'marketing.feature2.body':
      'Take payment online or at the table. We charge no per-order commission — 100% of your revenue stays yours.',
    'marketing.feature3.title': 'Real-time kitchen',
    'marketing.feature3.body':
      'Orders reach the kitchen the instant they\'re placed. No lost tickets, no shouting across the room.',
    'marketing.feature4.title': 'Coordinated waitstaff',
    'marketing.feature4.body':
      'Every waiter sees their assigned tables, orders ready to serve, and pending payments in one screen.',
    'marketing.feature5.title': 'Real analytics',
    'marketing.feature5.body':
      'Revenue, service times, your busiest tables. Decisions based on data, not guesswork.',
    'marketing.feature6.title': 'Menus in 5 languages',
    'marketing.feature6.body':
      'Spanish, English, Portuguese, German, and French — international guests order in their own language, no extra effort from you.',
    'marketing.feature7.title': 'More Google reviews',
    'marketing.feature7.body':
      'Every paying customer automatically gets a review invitation, at exactly the right moment.',

    'marketing.why.eyebrow': 'Why N2B',
    'marketing.why.headline': 'Built so trying it never feels risky.',
    'marketing.why1.title': 'No commitment',
    'marketing.why1.body':
      "A full 7-day trial. If it's not for you, cancel in one click — no contracts, no fine print.",
    'marketing.why2.title': 'You keep 100%',
    'marketing.why2.body':
      "Unlike other platforms, we don't take a cut of every order. What your restaurant sells is yours.",
    'marketing.why3.title': 'Live in minutes',
    'marketing.why3.body':
      'No new hardware, no installation. Build your menu, print your QR codes, and start taking orders today.',
    'marketing.why4.title': 'Secure payments',
    'marketing.why4.body':
      "Every charge runs through Stripe. We never store or see your customers' card details.",

    'marketing.preview.eyebrow': 'Your dashboard',
    'marketing.preview.headline': 'Your whole restaurant, on one screen.',
    'marketing.preview.body':
      'Orders, tables, staff, and analytics — organized and live.',

    'marketing.qr.eyebrow': 'Scan. Order. Enjoy.',
    'marketing.qr.body':
      'Print a unique QR code for each table in seconds, straight from your dashboard.',
    'marketing.qr.tableLabel': 'Table 12',

    'marketing.pricing.eyebrow': 'Pricing',
    'marketing.pricing.headline': 'A plan for every size of restaurant.',
    'marketing.pricing.subheadline':
      'Start with a 7-day free trial on any plan. Switch or cancel anytime.',

    'marketing.finalCta.headline': 'Automate today. A better restaurant tomorrow.',
    'marketing.finalCta.body':
      'Join the new generation of restaurants running orders, payments, and staff from one place.',
    'marketing.finalCta.cta': 'Start free trial',

    'marketing.footer.tagline': 'Restaurant operations automated.',
    'marketing.footer.linkLogin': 'Log in',
    'marketing.footer.linkRegister': 'Create account',
    'marketing.footer.copyright': '© 2026 N2B. All rights reserved.',
  },
  pt: {
    'marketing.nav.features': 'Funcionalidades',
    'marketing.nav.pricing': 'Preços',
    'marketing.nav.login': 'Iniciar sessão',
    'marketing.nav.getStarted': 'Começar grátis',

    'marketing.hero.eyebrow': 'Operações de restaurante automatizadas',
    'marketing.hero.headline': 'Restaurantes mais inteligentes. Clientes mais felizes.',
    'marketing.hero.subheadline':
      'Digitalize, peça e pague — sem descarregar nenhuma app. Configure o seu menu em minutos e comece a receber pedidos hoje.',
    'marketing.hero.ctaPrimary': 'Comece o seu teste gratuito de 7 dias',
    'marketing.hero.ctaSecondary': 'Veja como funciona',
    'marketing.hero.trustNote':
      'Teste completo de 7 dias. Cancele quando quiser — sem letra pequena.',

    'marketing.pain.eyebrow': 'O problema',
    'marketing.pain.headline': 'Cada minuto de espera é uma mesa que arrefece.',
    'marketing.pain.body':
      'Os menus em papel ficam desatualizados. Os empregados de mesa correm entre a sala e a cozinha. O pagamento demora no final da refeição. O N2B liga cada etapa — desde o momento em que o cliente digitaliza o código até ao pagamento — num único sistema em tempo real.',

    'marketing.features.eyebrow': 'Tudo incluído',
    'marketing.features.headline': 'Um sistema, não um monte de soluções remendadas.',
    'marketing.feature1.title': 'Pedido por QR e NFC',
    'marketing.feature1.body':
      'O cliente digitaliza o código da sua mesa, vê o menu e faz o pedido a partir do seu próprio telemóvel. Sem descarregar nada.',
    'marketing.feature2.title': 'Pagamentos com Stripe',
    'marketing.feature2.body':
      'Receba pagamentos online ou na mesa. Não cobramos comissão por pedido — 100% da sua receita é sua.',
    'marketing.feature3.title': 'Cozinha em tempo real',
    'marketing.feature3.body':
      'Os pedidos chegam à cozinha no instante em que são feitos. Sem talões perdidos, sem gritar pela sala.',
    'marketing.feature4.title': 'Equipa de sala coordenada',
    'marketing.feature4.body':
      'Cada empregado vê as suas mesas atribuídas, os pedidos prontos a servir e os pagamentos pendentes num único painel.',
    'marketing.feature5.title': 'Análises reais',
    'marketing.feature5.body':
      'Receita, tempos de serviço, as suas mesas mais ativas. Decisões baseadas em dados, não em intuição.',
    'marketing.feature6.title': 'Menu em 5 idiomas',
    'marketing.feature6.body':
      'Espanhol, inglês, português, alemão e francês — os seus clientes internacionais pedem no seu próprio idioma, sem esforço extra da sua parte.',
    'marketing.feature7.title': 'Mais avaliações no Google',
    'marketing.feature7.body':
      'Cada cliente que paga recebe automaticamente um convite para deixar uma avaliação, no momento certo.',

    'marketing.why.eyebrow': 'Porquê o N2B',
    'marketing.why.headline': 'Feito para que experimentar nunca pareça arriscado.',
    'marketing.why1.title': 'Sem compromisso',
    'marketing.why1.body':
      'Um teste completo de 7 dias. Se não for para si, cancele com um clique — sem contratos, sem letra pequena.',
    'marketing.why2.title': 'Fica com 100%',
    'marketing.why2.body':
      'Ao contrário de outras plataformas, não cobramos comissão por pedido. O que o seu restaurante vende é seu.',
    'marketing.why3.title': 'Pronto em minutos',
    'marketing.why3.body':
      'Sem hardware novo, sem instalações. Crie o seu menu, imprima os seus códigos QR e comece a receber pedidos ainda hoje.',
    'marketing.why4.title': 'Pagamentos seguros',
    'marketing.why4.body':
      'Todos os pagamentos passam pela Stripe. Nunca armazenamos nem vemos os dados do cartão dos seus clientes.',

    'marketing.preview.eyebrow': 'O seu painel',
    'marketing.preview.headline': 'Todo o seu restaurante, num único ecrã.',
    'marketing.preview.body':
      'Pedidos, mesas, pessoal e análises — organizados e em tempo real.',

    'marketing.qr.eyebrow': 'Digitalize. Peça. Aproveite.',
    'marketing.qr.body':
      'Imprima um código QR único para cada mesa em segundos, diretamente a partir do seu painel.',
    'marketing.qr.tableLabel': 'Mesa 12',

    'marketing.pricing.eyebrow': 'Preços',
    'marketing.pricing.headline': 'Um plano para cada tamanho de restaurante.',
    'marketing.pricing.subheadline':
      'Comece com 7 dias grátis em qualquer plano. Mude ou cancele quando quiser.',

    'marketing.finalCta.headline': 'Automatize hoje. Um restaurante melhor amanhã.',
    'marketing.finalCta.body':
      'Junte-se à nova geração de restaurantes que gerem pedidos, pagamentos e equipa a partir de um único lugar.',
    'marketing.finalCta.cta': 'Começar teste gratuito',

    'marketing.footer.tagline': 'Operações de restaurante automatizadas.',
    'marketing.footer.linkLogin': 'Iniciar sessão',
    'marketing.footer.linkRegister': 'Criar conta',
    'marketing.footer.copyright': '© 2026 N2B. Todos os direitos reservados.',
  },
  de: {
    'marketing.nav.features': 'Funktionen',
    'marketing.nav.pricing': 'Preise',
    'marketing.nav.login': 'Anmelden',
    'marketing.nav.getStarted': 'Kostenlos starten',

    'marketing.hero.eyebrow': 'Restaurantabläufe automatisiert',
    'marketing.hero.headline': 'Intelligentere Restaurants. Zufriedenere Gäste.',
    'marketing.hero.subheadline':
      'Scannen, bestellen, bezahlen — keine App zum Herunterladen. Richte deine Speisekarte in Minuten ein und nimm noch heute Bestellungen an.',
    'marketing.hero.ctaPrimary': 'Starte deine 7-tägige kostenlose Testversion',
    'marketing.hero.ctaSecondary': 'So funktioniert es',
    'marketing.hero.trustNote':
      'Ein volle 7-tägige Testphase. Jederzeit kündbar — ohne Kleingedrucktes.',

    'marketing.pain.eyebrow': 'Das Problem',
    'marketing.pain.headline': 'Jede Minute Wartezeit lässt das Essen kälter werden.',
    'marketing.pain.body':
      'Papierkarten veralten. Kellner laufen zwischen Gastraum und Küche hin und her. Die Zahlung zieht sich am Ende des Essens hin. N2B verbindet jeden Schritt — vom Scannen des Codes bis zur Zahlung — in einem System in Echtzeit.',

    'marketing.features.eyebrow': 'Alles inklusive',
    'marketing.features.headline': 'Ein System, kein Sammelsurium aus Insellösungen.',
    'marketing.feature1.title': 'Bestellung per QR & NFC',
    'marketing.feature1.body':
      'Gäste scannen den Code ihres Tisches, sehen die Speisekarte und bestellen von ihrem eigenen Handy. Nichts zum Herunterladen.',
    'marketing.feature2.title': 'Zahlungen mit Stripe',
    'marketing.feature2.body':
      'Kassiere online oder am Tisch. Wir verlangen keine Provision pro Bestellung — 100 % deines Umsatzes bleiben dir.',
    'marketing.feature3.title': 'Küche in Echtzeit',
    'marketing.feature3.body':
      'Bestellungen erreichen die Küche in dem Moment, in dem sie aufgegeben werden. Keine verlorenen Bons, kein Rufen durch den Raum.',
    'marketing.feature4.title': 'Koordiniertes Servicepersonal',
    'marketing.feature4.body':
      'Jeder Kellner sieht seine zugewiesenen Tische, servierfertige Bestellungen und offene Zahlungen auf einem Bildschirm.',
    'marketing.feature5.title': 'Echte Analysen',
    'marketing.feature5.body':
      'Umsatz, Servicezeiten, deine meistbesuchten Tische. Entscheidungen auf Basis von Daten, nicht von Bauchgefühl.',
    'marketing.feature6.title': 'Speisekarte in 5 Sprachen',
    'marketing.feature6.body':
      'Spanisch, Englisch, Portugiesisch, Deutsch und Französisch — internationale Gäste bestellen in ihrer eigenen Sprache, ohne Mehraufwand für dich.',
    'marketing.feature7.title': 'Mehr Google-Bewertungen',
    'marketing.feature7.body':
      'Jeder zahlende Gast erhält automatisch eine Bewertungseinladung, genau im richtigen Moment.',

    'marketing.why.eyebrow': 'Warum N2B',
    'marketing.why.headline': 'So gebaut, dass Ausprobieren sich nie riskant anfühlt.',
    'marketing.why1.title': 'Keine Verpflichtung',
    'marketing.why1.body':
      'Eine volle 7-tägige Testphase. Wenn es nichts für dich ist, kündige mit einem Klick — ohne Verträge, ohne Kleingedrucktes.',
    'marketing.why2.title': 'Du behältst 100 %',
    'marketing.why2.body':
      'Anders als andere Plattformen nehmen wir keinen Anteil an deinen Bestellungen. Was dein Restaurant verkauft, gehört dir.',
    'marketing.why3.title': 'In Minuten startklar',
    'marketing.why3.body':
      'Keine neue Hardware, keine Installation. Erstelle deine Speisekarte, drucke deine QR-Codes und nimm noch heute Bestellungen an.',
    'marketing.why4.title': 'Sichere Zahlungen',
    'marketing.why4.body':
      'Jede Zahlung läuft über Stripe. Wir speichern oder sehen niemals die Kartendaten deiner Gäste.',

    'marketing.preview.eyebrow': 'Dein Dashboard',
    'marketing.preview.headline': 'Dein ganzes Restaurant auf einem Bildschirm.',
    'marketing.preview.body':
      'Bestellungen, Tische, Personal und Analysen — organisiert und live.',

    'marketing.qr.eyebrow': 'Scannen. Bestellen. Genießen.',
    'marketing.qr.body':
      'Drucke in Sekunden einen einzigartigen QR-Code für jeden Tisch — direkt aus deinem Dashboard.',
    'marketing.qr.tableLabel': 'Tisch 12',

    'marketing.pricing.eyebrow': 'Preise',
    'marketing.pricing.headline': 'Ein Plan für jede Restaurantgröße.',
    'marketing.pricing.subheadline':
      'Starte mit einer 7-tägigen kostenlosen Testphase bei jedem Plan. Wechsle oder kündige jederzeit.',

    'marketing.finalCta.headline': 'Automatisiere heute. Ein besseres Restaurant morgen.',
    'marketing.finalCta.body':
      'Werde Teil der neuen Generation von Restaurants, die Bestellungen, Zahlungen und Personal an einem Ort verwalten.',
    'marketing.finalCta.cta': 'Kostenlose Testversion starten',

    'marketing.footer.tagline': 'Restaurantabläufe automatisiert.',
    'marketing.footer.linkLogin': 'Anmelden',
    'marketing.footer.linkRegister': 'Konto erstellen',
    'marketing.footer.copyright': '© 2026 N2B. Alle Rechte vorbehalten.',
  },
  fr: {
    'marketing.nav.features': 'Fonctionnalités',
    'marketing.nav.pricing': 'Tarifs',
    'marketing.nav.login': 'Se connecter',
    'marketing.nav.getStarted': 'Commencer gratuitement',

    'marketing.hero.eyebrow': 'Les opérations du restaurant, automatisées',
    'marketing.hero.headline': 'Des restaurants plus intelligents. Des clients plus heureux.',
    'marketing.hero.subheadline':
      'Scanner, commander et payer — sans télécharger d\'application. Configurez votre menu en quelques minutes et recevez des commandes dès aujourd\'hui.',
    'marketing.hero.ctaPrimary': "Démarrez votre essai gratuit de 7 jours",
    'marketing.hero.ctaSecondary': 'Voir comment ça marche',
    'marketing.hero.trustNote':
      "Un essai complet de 7 jours. Annulez quand vous voulez — sans petites lignes.",

    'marketing.pain.eyebrow': 'Le problème',
    'marketing.pain.headline': "Chaque minute d'attente, c'est un plat qui refroidit.",
    'marketing.pain.body':
      "Les menus papier deviennent obsolètes. Les serveurs courent entre la salle et la cuisine. Le paiement traîne en fin de repas. N2B relie chaque étape — du scan du code jusqu'au paiement — dans un seul système en temps réel.",

    'marketing.features.eyebrow': 'Tout est inclus',
    'marketing.features.headline': 'Un seul système, pas un empilement d\'outils bricolés.',
    'marketing.feature1.title': 'Commande par QR et NFC',
    'marketing.feature1.body':
      'Le client scanne le code de sa table, consulte le menu et commande depuis son propre téléphone. Rien à télécharger.',
    'marketing.feature2.title': 'Paiements avec Stripe',
    'marketing.feature2.body':
      "Encaissez en ligne ou à table. Nous ne prenons aucune commission par commande — 100 % de votre chiffre d'affaires reste à vous.",
    'marketing.feature3.title': 'Cuisine en temps réel',
    'marketing.feature3.body':
      "Les commandes arrivent en cuisine à l'instant où elles sont passées. Plus de tickets perdus, plus besoin de crier à travers la salle.",
    'marketing.feature4.title': 'Une équipe de salle coordonnée',
    'marketing.feature4.body':
      'Chaque serveur voit ses tables assignées, les commandes prêtes à servir et les paiements en attente sur un seul écran.',
    'marketing.feature5.title': 'De vraies analyses',
    'marketing.feature5.body':
      "Chiffre d'affaires, temps de service, vos tables les plus actives. Des décisions basées sur des données, pas sur l'intuition.",
    'marketing.feature6.title': 'Menu en 5 langues',
    'marketing.feature6.body':
      'Espagnol, anglais, portugais, allemand et français — vos clients internationaux commandent dans leur langue, sans effort supplémentaire de votre part.',
    'marketing.feature7.title': 'Plus d\'avis Google',
    'marketing.feature7.body':
      'Chaque client qui paie reçoit automatiquement une invitation à laisser un avis, au moment idéal.',

    'marketing.why.eyebrow': 'Pourquoi N2B',
    'marketing.why.headline': "Conçu pour qu'essayer ne soit jamais un risque.",
    'marketing.why1.title': 'Sans engagement',
    'marketing.why1.body':
      "Un essai complet de 7 jours. Si ce n'est pas pour vous, annulez en un clic — sans contrat, sans petites lignes.",
    'marketing.why2.title': 'Vous gardez 100 %',
    'marketing.why2.body':
      "Contrairement à d'autres plateformes, nous ne prenons aucune commission sur vos commandes. Ce que vend votre restaurant vous appartient.",
    'marketing.why3.title': 'Opérationnel en quelques minutes',
    'marketing.why3.body':
      "Pas de nouveau matériel, pas d'installation. Créez votre menu, imprimez vos codes QR et recevez des commandes dès aujourd'hui.",
    'marketing.why4.title': 'Paiements sécurisés',
    'marketing.why4.body':
      'Chaque paiement passe par Stripe. Nous ne stockons ni ne voyons jamais les données de carte de vos clients.',

    'marketing.preview.eyebrow': 'Votre tableau de bord',
    'marketing.preview.headline': 'Tout votre restaurant, sur un seul écran.',
    'marketing.preview.body':
      'Commandes, tables, personnel et analyses — organisés et en direct.',

    'marketing.qr.eyebrow': 'Scannez. Commandez. Savourez.',
    'marketing.qr.body':
      'Imprimez un code QR unique pour chaque table en quelques secondes, directement depuis votre tableau de bord.',
    'marketing.qr.tableLabel': 'Table 12',

    'marketing.pricing.eyebrow': 'Tarifs',
    'marketing.pricing.headline': 'Une formule pour chaque taille de restaurant.',
    'marketing.pricing.subheadline':
      "Commencez avec un essai gratuit de 7 jours, sur n'importe quelle formule. Changez ou annulez quand vous voulez.",

    'marketing.finalCta.headline': "Automatisez aujourd'hui. Un meilleur restaurant demain.",
    'marketing.finalCta.body':
      'Rejoignez la nouvelle génération de restaurants qui gèrent commandes, paiements et équipe depuis un seul endroit.',
    'marketing.finalCta.cta': "Démarrer l'essai gratuit",

    'marketing.footer.tagline': 'Les opérations du restaurant, automatisées.',
    'marketing.footer.linkLogin': 'Se connecter',
    'marketing.footer.linkRegister': 'Créer un compte',
    'marketing.footer.copyright': '© 2026 N2B. Tous droits réservés.',
  },
};
