import type { Locale } from '../locales';

/**
 * Dashboard shell + settings: app/dashboard/[restaurantId]/layout.tsx,
 * app/dashboard/[restaurantId]/page.tsx, app/dashboard/page.tsx,
 * app/dashboard/[restaurantId]/settings/page.tsx,
 * app/dashboard/[restaurantId]/settings/payments/page.tsx.
 */
export const dashboardCore: Record<Locale, Record<string, string>> = {
  es: {
    // layout.tsx — tab nav
    'dashboardCore.nav.menu': 'Menú',
    'dashboardCore.nav.tables': 'Mesas',
    'dashboardCore.nav.orders': 'Pedidos',
    'dashboardCore.nav.analytics': 'Analítica',
    'dashboardCore.nav.kitchen': 'Cocina',
    'dashboardCore.nav.waiter': 'Camarero',
    'dashboardCore.nav.waiters': 'Personal',
    'dashboardCore.nav.payments': 'Pagos',
    'dashboardCore.nav.dashboard': 'Panel',
    'dashboardCore.nav.portalsHeading': 'Portales',

    // app/dashboard/[restaurantId]/page.tsx — hub
    'dashboardCore.hub.loading': 'Cargando restaurante...',
    'dashboardCore.hub.unavailableTitle': 'Restaurante no disponible',
    'dashboardCore.hub.couldNotLoadAccess':
      'No se pudo cargar el acceso al restaurante.',
    'dashboardCore.hub.noAccess': 'No tienes acceso a este restaurante.',
    'dashboardCore.hub.couldNotLoad': 'No se pudo cargar el restaurante.',
    'dashboardCore.hub.eyebrow': 'Restaurante',
    'dashboardCore.hub.whereToGo': '¿A dónde quieres ir?',
    'dashboardCore.hub.managerTitle': 'Gestión',
    'dashboardCore.hub.managerDescription':
      'Gestiona el menú, las mesas, los pedidos, el personal, la analítica y la configuración.',
    'dashboardCore.hub.kitchenTitle': 'Cocina',
    'dashboardCore.hub.kitchenDescription':
      'Consulta los pedidos entrantes y gestiona la preparación en cocina.',
    'dashboardCore.hub.waiterTitle': 'Camarero',
    'dashboardCore.hub.waiterDescription':
      'Sirve pedidos, consulta el estado de las mesas y cobra los pagos.',
    'dashboardCore.hub.enter': 'Entrar →',

    // app/dashboard/page.tsx — restaurant list
    'dashboardCore.list.title': 'Tus restaurantes',
    'dashboardCore.list.newRestaurant': '+ Nuevo restaurante',
    'dashboardCore.list.namePlaceholder': 'Nombre del restaurante',
    'dashboardCore.list.couldNotCreate': 'No se pudo crear el restaurante',
    'dashboardCore.list.loading': 'Cargando...',
    'dashboardCore.list.create': 'Crear',
    'dashboardCore.list.empty':
      'Aún no tienes restaurantes — crea el primero arriba.',

    // settings/page.tsx
    'dashboardCore.settings.notConfigured': 'No configurado',
    'dashboardCore.settings.loading': 'Cargando configuración...',
    'dashboardCore.settings.unableToLoad':
      'No se pudo cargar la configuración del restaurante',
    'dashboardCore.settings.unableToLoadShort':
      'No se pudo cargar la configuración',
    'dashboardCore.settings.unableToSave':
      'No se pudo guardar la configuración',
    'dashboardCore.settings.savedSuccess':
      'Configuración guardada correctamente.',
    'dashboardCore.settings.title': 'Configuración',
    'dashboardCore.settings.subtitle':
      'Gestiona la configuración del restaurante, los objetivos de servicio y las opciones de reseñas de clientes.',
    'dashboardCore.settings.restaurantHeading': 'Restaurante',
    'dashboardCore.settings.restaurantSubtitle':
      'Información básica sobre tu restaurante.',
    'dashboardCore.settings.restaurantName': 'Nombre del restaurante',
    'dashboardCore.settings.slug': 'Slug',
    'dashboardCore.settings.currency': 'Moneda',
    'dashboardCore.settings.timezone': 'Zona horaria',
    'dashboardCore.settings.googleReviewsHeading': 'Reseñas de Google',
    'dashboardCore.settings.googleReviewsSubtitle':
      'Define la URL que deben usar los clientes para dejar una reseña en Google.',
    'dashboardCore.settings.googleReviewUrlLabel': 'URL de reseña de Google',
    'dashboardCore.settings.googleReviewHelp':
      'Este enlace podrá usarse más adelante en el flujo de reseñas/NFC tras un pedido completado.',
    'dashboardCore.settings.brandingHeading': 'Marca y estética',
    'dashboardCore.settings.brandingSubtitle':
      'Cómo se ve tu carta online para los clientes.',
    'dashboardCore.settings.brandColorLabel': 'Color de acento',
    'dashboardCore.settings.brandFontLabel': 'Tipografía',
    'dashboardCore.settings.brandFontDefault': 'Por defecto (N2B)',
    'dashboardCore.settings.brandFontElegantScript': 'Elegante y clásico',
    'dashboardCore.settings.brandFontModernSerif': 'Serif moderno',
    'dashboardCore.settings.brandFontRusticHandwritten': 'Rústico y artesanal',
    'dashboardCore.settings.brandFontBoldModern': 'Moderno y atrevido',
    'dashboardCore.settings.brandFontSample': 'Tu Restaurante',
    'dashboardCore.settings.menuBackgroundLabel': 'Fondo de la carta',
    'dashboardCore.settings.removeMenuBackground': 'Quitar fondo',
    'dashboardCore.settings.menuBackgroundHelp':
      'Para cambiarlo por otra foto, vuelve a importar el menú desde fotos.',
    'dashboardCore.settings.menuFontScaleLabel': 'Tamaño del texto de la carta',
    'dashboardCore.settings.menuFontScaleSmall': 'Pequeño',
    'dashboardCore.settings.menuFontScaleMedium': 'Mediano',
    'dashboardCore.settings.menuFontScaleLarge': 'Grande',
    'dashboardCore.settings.menuLayoutModeLabel': 'Estilo de la carta online',
    'dashboardCore.settings.menuLayoutModeList': 'Lista',
    'dashboardCore.settings.menuLayoutModePoster': 'Póster (foto real)',
    'dashboardCore.settings.menuLayoutModeListHelp':
      'La carta se muestra como una lista, con tu foto difuminada de fondo.',
    'dashboardCore.settings.menuLayoutModePosterHelp':
      'La carta se muestra sobre tu foto real (sin difuminar), con cada plato colocado a mano donde tú decidas.',
    'dashboardCore.settings.editPosterPositionsLink': 'Colocar los platos sobre la foto →',
    'dashboardCore.settings.menuBackgroundBlurLabel': 'Desenfoque del fondo',
    'dashboardCore.settings.menuBackgroundTintLabel': 'Opacidad del velo',
    'dashboardCore.settings.staffJoinHeading': 'Acceso del personal',
    'dashboardCore.settings.staffJoinSubtitle':
      'Comparte esta contraseña con tus camareros y cocina para que creen su propia cuenta.',
    'dashboardCore.settings.staffJoinConfigured': 'Configurada',
    'dashboardCore.settings.staffJoinNotConfigured': 'No configurada',
    'dashboardCore.settings.staffJoinLinkLabel': 'Enlace para unirse',
    'dashboardCore.settings.staffJoinSetPlaceholder': 'Crear contraseña (mínimo 6 caracteres)',
    'dashboardCore.settings.staffJoinChangePlaceholder': 'Cambiar contraseña',
    'dashboardCore.settings.staffJoinSave': 'Guardar',
    'dashboardCore.settings.staffJoinClear': 'Desactivar',
    'dashboardCore.settings.staffJoinPasswordTooShort': 'Debe tener al menos 6 caracteres.',
    'dashboardCore.settings.slaHeading': 'Acuerdos de nivel de servicio',
    'dashboardCore.settings.slaSubtitle':
      'Configura los objetivos que usa la analítica para identificar un servicio lento.',
    'dashboardCore.settings.acceptanceLabel': 'Pedido → Aceptado',
    'dashboardCore.settings.acceptedLabel': 'Aceptado → Listo',
    'dashboardCore.settings.readyLabel': 'Listo → Servido',
    'dashboardCore.settings.staffResponseTime':
      'Tiempo de respuesta del personal',
    'dashboardCore.settings.kitchenPrepTarget':
      'Objetivo de preparación en cocina',
    'dashboardCore.settings.waiterDeliveryTarget':
      'Objetivo de entrega del camarero',
    'dashboardCore.settings.totalServiceSla': 'SLA de servicio total',
    'dashboardCore.settings.calculatedAutomatically':
      'Se calcula automáticamente a partir de las tres etapas de servicio.',
    'dashboardCore.settings.currentStatusHeading': 'Estado actual',
    'dashboardCore.settings.restaurantStatusLabel': 'Restaurante',
    'dashboardCore.settings.open': 'Abierto',
    'dashboardCore.settings.closed': 'Cerrado',
    'dashboardCore.settings.restaurantStatusDescription':
      'Mientras esté cerrado, los clientes no podrán enviar pedidos nuevos.',
    'dashboardCore.settings.accountLabel': 'Cuenta',
    'dashboardCore.settings.saveSettings': 'Guardar configuración',

    // settings/payments/page.tsx
    'dashboardCore.paymentsSettings.couldNotLoad':
      'No se pudo cargar la configuración del restaurante',
    'dashboardCore.paymentsSettings.restaurantNotFound':
      'Restaurante no encontrado',
    'dashboardCore.paymentsSettings.couldNotStartStripe':
      'No se pudo iniciar la incorporación a Stripe',
    'dashboardCore.paymentsSettings.couldNotSavePayment':
      'No se pudo guardar la configuración de pagos',
    'dashboardCore.paymentsSettings.couldNotSaveReview':
      'No se pudo guardar el enlace de reseña',
    'dashboardCore.paymentsSettings.couldNotSaveSla':
      'No se pudieron guardar los ajustes de SLA',
    'dashboardCore.paymentsSettings.slaAllRequired':
      'Introduce valores válidos para los tres campos de SLA',
    'dashboardCore.paymentsSettings.acceptanceRange':
      'El SLA de aceptación debe estar entre 0,5 y 30 minutos',
    'dashboardCore.paymentsSettings.kitchenRange':
      'El SLA de cocina debe estar entre 1 y 60 minutos',
    'dashboardCore.paymentsSettings.waiterRange':
      'El SLA de camarero debe estar entre 0,5 y 30 minutos',
    'dashboardCore.paymentsSettings.eyebrow': 'Configuración del restaurante',
    'dashboardCore.paymentsSettings.title': 'Configuración',
    'dashboardCore.paymentsSettings.paymentsEyebrow': 'Pagos',
    'dashboardCore.paymentsSettings.stripeHeading': 'Stripe',
    'dashboardCore.paymentsSettings.stripeDescription':
      'Conecta tu propia cuenta de Stripe para que los pagos de los clientes se depositen directamente en ti. Te quedas con el 100% de tus ingresos.',
    'dashboardCore.paymentsSettings.redirecting': 'Redirigiendo...',
    'dashboardCore.paymentsSettings.connectStripe': 'Conectar cuenta de Stripe',
    'dashboardCore.paymentsSettings.payAtRestaurantLabel':
      'Pagar en el restaurante',
    'dashboardCore.paymentsSettings.payAtRestaurantDescription':
      'Permite que los clientes terminen su comida pagando en persona (efectivo, tarjeta u otro) en lugar de pagar con Stripe. El personal confirma el cobro desde el panel de pedidos.',
    'dashboardCore.paymentsSettings.customerExperienceEyebrow':
      'Experiencia del cliente',
    'dashboardCore.paymentsSettings.googleReviewsHeading': 'Reseñas de Google',
    'dashboardCore.paymentsSettings.googleReviewsDescription':
      'Cuando el cliente paga la cuenta completa de la mesa, se le enviará a este enlace de reseña de Google.',
    'dashboardCore.paymentsSettings.saveReviewLink': 'Guardar enlace de reseña',
    'dashboardCore.paymentsSettings.serviceIntelligenceEyebrow':
      'Inteligencia de servicio',
    'dashboardCore.paymentsSettings.slaHeading':
      'Acuerdos de nivel de servicio',
    'dashboardCore.paymentsSettings.slaDescription':
      'Edita los objetivos de servicio a continuación. Los cambios se activan solo después de pulsar Guardar.',
    'dashboardCore.paymentsSettings.orderAcceptanceLabel':
      'Aceptación de pedidos',
    'dashboardCore.paymentsSettings.createdToAccepted': 'Creado → Aceptado',
    'dashboardCore.paymentsSettings.minutes': 'minutos',
    'dashboardCore.paymentsSettings.savedValue': 'Valor guardado:',
    'dashboardCore.paymentsSettings.kitchenServiceLabel': 'Servicio de cocina',
    'dashboardCore.paymentsSettings.acceptedToReady': 'Aceptado → Listo',
    'dashboardCore.paymentsSettings.waiterDeliveryLabel':
      'Entrega del camarero',
    'dashboardCore.paymentsSettings.readyToServed': 'Listo → Servido',
    'dashboardCore.paymentsSettings.totalServiceLabel': 'Servicio total',
    'dashboardCore.paymentsSettings.createdToServed': 'Creado → Servido',
    'dashboardCore.paymentsSettings.automatic': 'Automático',
    'dashboardCore.paymentsSettings.currentDraft':
      'Borrador actual: {{acceptance}} + {{kitchen}} + {{waiter}} minutos',
    'dashboardCore.paymentsSettings.saveSla': 'Guardar ajustes de SLA',
    'dashboardCore.paymentsSettings.undoChanges': 'Deshacer cambios',
    'dashboardCore.paymentsSettings.resetToDefaults':
      'Restablecer valores predeterminados',
    'dashboardCore.paymentsSettings.configurationEyebrow': 'Configuración',
    'dashboardCore.paymentsSettings.savedTargetsHeading': 'Objetivos guardados',
    'dashboardCore.paymentsSettings.lastSavedValues':
      'Últimos valores guardados correctamente.',
    'dashboardCore.paymentsSettings.persisted': 'Guardado',
    'dashboardCore.paymentsSettings.acceptanceShort': 'Aceptación',
    'dashboardCore.paymentsSettings.kitchenShort': 'Cocina',
    'dashboardCore.paymentsSettings.waiterShort': 'Camarero',
    'dashboardCore.paymentsSettings.autoCalculatedFooter':
      'El total se calcula automáticamente a partir de los tres objetivos de servicio guardados.',
  },
  en: {
    // layout.tsx — tab nav
    'dashboardCore.nav.menu': 'Menu',
    'dashboardCore.nav.tables': 'Tables',
    'dashboardCore.nav.orders': 'Orders',
    'dashboardCore.nav.analytics': 'Analytics',
    'dashboardCore.nav.kitchen': 'Kitchen',
    'dashboardCore.nav.waiter': 'Waiter',
    'dashboardCore.nav.waiters': 'Staff',
    'dashboardCore.nav.payments': 'Payments',
    'dashboardCore.nav.dashboard': 'Dashboard',
    'dashboardCore.nav.portalsHeading': 'Portals',

    // app/dashboard/[restaurantId]/page.tsx — hub
    'dashboardCore.hub.loading': 'Loading restaurant...',
    'dashboardCore.hub.unavailableTitle': 'Restaurant unavailable',
    'dashboardCore.hub.couldNotLoadAccess':
      'Could not load restaurant access.',
    'dashboardCore.hub.noAccess': 'You do not have access to this restaurant.',
    'dashboardCore.hub.couldNotLoad': 'Could not load restaurant.',
    'dashboardCore.hub.eyebrow': 'Restaurant',
    'dashboardCore.hub.whereToGo': 'Where do you want to go?',
    'dashboardCore.hub.managerTitle': 'Manager',
    'dashboardCore.hub.managerDescription':
      'Manage the menu, tables, orders, staff, analytics and settings.',
    'dashboardCore.hub.kitchenTitle': 'Kitchen',
    'dashboardCore.hub.kitchenDescription':
      'View incoming orders and manage kitchen preparation.',
    'dashboardCore.hub.waiterTitle': 'Waiter',
    'dashboardCore.hub.waiterDescription':
      'Serve orders, view table status and collect payments.',
    'dashboardCore.hub.enter': 'Enter →',

    // app/dashboard/page.tsx — restaurant list
    'dashboardCore.list.title': 'Your restaurants',
    'dashboardCore.list.newRestaurant': '+ New restaurant',
    'dashboardCore.list.namePlaceholder': 'Restaurant name',
    'dashboardCore.list.couldNotCreate': 'Could not create restaurant',
    'dashboardCore.list.loading': 'Loading...',
    'dashboardCore.list.create': 'Create',
    'dashboardCore.list.empty':
      'No restaurants yet — create your first one above.',

    // settings/page.tsx
    'dashboardCore.settings.notConfigured': 'Not configured',
    'dashboardCore.settings.loading': 'Loading settings...',
    'dashboardCore.settings.unableToLoad':
      'Unable to load restaurant settings',
    'dashboardCore.settings.unableToLoadShort': 'Unable to load settings',
    'dashboardCore.settings.unableToSave': 'Unable to save settings',
    'dashboardCore.settings.savedSuccess': 'Settings saved successfully.',
    'dashboardCore.settings.title': 'Settings',
    'dashboardCore.settings.subtitle':
      'Manage restaurant configuration, service targets and customer review settings.',
    'dashboardCore.settings.restaurantHeading': 'Restaurant',
    'dashboardCore.settings.restaurantSubtitle':
      'Basic information about your restaurant.',
    'dashboardCore.settings.restaurantName': 'Restaurant name',
    'dashboardCore.settings.slug': 'Slug',
    'dashboardCore.settings.currency': 'Currency',
    'dashboardCore.settings.timezone': 'Timezone',
    'dashboardCore.settings.googleReviewsHeading': 'Google Reviews',
    'dashboardCore.settings.googleReviewsSubtitle':
      'Set the URL customers should use to leave a Google review.',
    'dashboardCore.settings.googleReviewUrlLabel': 'Google review URL',
    'dashboardCore.settings.googleReviewHelp':
      'This link can later be used by the review/NFC flow after a completed order.',
    'dashboardCore.settings.brandingHeading': 'Branding & look',
    'dashboardCore.settings.brandingSubtitle':
      'How your online menu looks to customers.',
    'dashboardCore.settings.brandColorLabel': 'Accent color',
    'dashboardCore.settings.brandFontLabel': 'Typography',
    'dashboardCore.settings.brandFontDefault': 'Default (N2B)',
    'dashboardCore.settings.brandFontElegantScript': 'Elegant & classic',
    'dashboardCore.settings.brandFontModernSerif': 'Modern serif',
    'dashboardCore.settings.brandFontRusticHandwritten': 'Rustic & handwritten',
    'dashboardCore.settings.brandFontBoldModern': 'Bold & modern',
    'dashboardCore.settings.brandFontSample': 'Your Restaurant',
    'dashboardCore.settings.menuBackgroundLabel': 'Menu background',
    'dashboardCore.settings.removeMenuBackground': 'Remove background',
    'dashboardCore.settings.menuBackgroundHelp':
      'To change it to a different photo, re-import your menu from photos.',
    'dashboardCore.settings.menuFontScaleLabel': 'Menu text size',
    'dashboardCore.settings.menuFontScaleSmall': 'Small',
    'dashboardCore.settings.menuFontScaleMedium': 'Medium',
    'dashboardCore.settings.menuFontScaleLarge': 'Large',
    'dashboardCore.settings.menuLayoutModeLabel': 'Online menu style',
    'dashboardCore.settings.menuLayoutModeList': 'List',
    'dashboardCore.settings.menuLayoutModePoster': 'Poster (real photo)',
    'dashboardCore.settings.menuLayoutModeListHelp':
      'The menu shows as a list, with your blurred photo behind it.',
    'dashboardCore.settings.menuLayoutModePosterHelp':
      'The menu shows over your real photo (not blurred), with each dish placed by hand wherever you decide.',
    'dashboardCore.settings.editPosterPositionsLink': 'Place dishes on the photo →',
    'dashboardCore.settings.menuBackgroundBlurLabel': 'Background blur',
    'dashboardCore.settings.menuBackgroundTintLabel': 'Tint opacity',
    'dashboardCore.settings.staffJoinHeading': 'Staff access',
    'dashboardCore.settings.staffJoinSubtitle':
      'Share this password with your waiters and kitchen so they can create their own account.',
    'dashboardCore.settings.staffJoinConfigured': 'Configured',
    'dashboardCore.settings.staffJoinNotConfigured': 'Not configured',
    'dashboardCore.settings.staffJoinLinkLabel': 'Link to join',
    'dashboardCore.settings.staffJoinSetPlaceholder': 'Set a password (min. 6 characters)',
    'dashboardCore.settings.staffJoinChangePlaceholder': 'Change password',
    'dashboardCore.settings.staffJoinSave': 'Save',
    'dashboardCore.settings.staffJoinClear': 'Turn off',
    'dashboardCore.settings.staffJoinPasswordTooShort': 'Must be at least 6 characters.',
    'dashboardCore.settings.slaHeading': 'Service Level Agreements',
    'dashboardCore.settings.slaSubtitle':
      'Configure the targets used by Analytics to identify slow service.',
    'dashboardCore.settings.acceptanceLabel': 'Order → Accepted',
    'dashboardCore.settings.acceptedLabel': 'Accepted → Ready',
    'dashboardCore.settings.readyLabel': 'Ready → Served',
    'dashboardCore.settings.staffResponseTime': 'Staff response time',
    'dashboardCore.settings.kitchenPrepTarget': 'Kitchen preparation target',
    'dashboardCore.settings.waiterDeliveryTarget': 'Waiter delivery target',
    'dashboardCore.settings.totalServiceSla': 'Total service SLA',
    'dashboardCore.settings.calculatedAutomatically':
      'Calculated automatically from the three service stages.',
    'dashboardCore.settings.currentStatusHeading': 'Current status',
    'dashboardCore.settings.restaurantStatusLabel': 'Restaurant',
    'dashboardCore.settings.open': 'Open',
    'dashboardCore.settings.closed': 'Closed',
    'dashboardCore.settings.restaurantStatusDescription':
      'While closed, customers won’t be able to place new orders.',
    'dashboardCore.settings.accountLabel': 'Account',
    'dashboardCore.settings.saveSettings': 'Save settings',

    // settings/payments/page.tsx
    'dashboardCore.paymentsSettings.couldNotLoad':
      'Could not load restaurant settings',
    'dashboardCore.paymentsSettings.restaurantNotFound':
      'Restaurant not found',
    'dashboardCore.paymentsSettings.couldNotStartStripe':
      'Could not start Stripe onboarding',
    'dashboardCore.paymentsSettings.couldNotSavePayment':
      'Could not save payment settings',
    'dashboardCore.paymentsSettings.couldNotSaveReview':
      'Could not save review URL',
    'dashboardCore.paymentsSettings.couldNotSaveSla':
      'Could not save SLA settings',
    'dashboardCore.paymentsSettings.slaAllRequired':
      'Please enter valid values for all three SLA fields',
    'dashboardCore.paymentsSettings.acceptanceRange':
      'Acceptance SLA must be between 0.5 and 30 minutes',
    'dashboardCore.paymentsSettings.kitchenRange':
      'Kitchen SLA must be between 1 and 60 minutes',
    'dashboardCore.paymentsSettings.waiterRange':
      'Waiter SLA must be between 0.5 and 30 minutes',
    'dashboardCore.paymentsSettings.eyebrow': 'Restaurant settings',
    'dashboardCore.paymentsSettings.title': 'Settings',
    'dashboardCore.paymentsSettings.paymentsEyebrow': 'Payments',
    'dashboardCore.paymentsSettings.stripeHeading': 'Stripe',
    'dashboardCore.paymentsSettings.stripeDescription':
      'Connect your own Stripe account so customer payments are deposited directly to you. You keep 100% of your revenue.',
    'dashboardCore.paymentsSettings.redirecting': 'Redirecting...',
    'dashboardCore.paymentsSettings.connectStripe': 'Connect Stripe account',
    'dashboardCore.paymentsSettings.payAtRestaurantLabel':
      'Pay at restaurant',
    'dashboardCore.paymentsSettings.payAtRestaurantDescription':
      'Let customers finish their meal by paying in person (cash, card or other) instead of Stripe checkout. Staff confirm collection from the orders dashboard.',
    'dashboardCore.paymentsSettings.customerExperienceEyebrow':
      'Customer experience',
    'dashboardCore.paymentsSettings.googleReviewsHeading': 'Google Reviews',
    'dashboardCore.paymentsSettings.googleReviewsDescription':
      'After the customer pays the complete table bill, they will be sent to this Google review link.',
    'dashboardCore.paymentsSettings.saveReviewLink': 'Save review link',
    'dashboardCore.paymentsSettings.serviceIntelligenceEyebrow':
      'Service intelligence',
    'dashboardCore.paymentsSettings.slaHeading':
      'Service level agreements',
    'dashboardCore.paymentsSettings.slaDescription':
      'Edit the service targets below. Changes become active only after you press Save.',
    'dashboardCore.paymentsSettings.orderAcceptanceLabel':
      'Order acceptance',
    'dashboardCore.paymentsSettings.createdToAccepted': 'Created → Accepted',
    'dashboardCore.paymentsSettings.minutes': 'minutes',
    'dashboardCore.paymentsSettings.savedValue': 'Saved value:',
    'dashboardCore.paymentsSettings.kitchenServiceLabel': 'Kitchen service',
    'dashboardCore.paymentsSettings.acceptedToReady': 'Accepted → Ready',
    'dashboardCore.paymentsSettings.waiterDeliveryLabel': 'Waiter delivery',
    'dashboardCore.paymentsSettings.readyToServed': 'Ready → Served',
    'dashboardCore.paymentsSettings.totalServiceLabel': 'Total service',
    'dashboardCore.paymentsSettings.createdToServed': 'Created → Served',
    'dashboardCore.paymentsSettings.automatic': 'Automatic',
    'dashboardCore.paymentsSettings.currentDraft':
      'Current draft: {{acceptance}} + {{kitchen}} + {{waiter}} minutes',
    'dashboardCore.paymentsSettings.saveSla': 'Save SLA settings',
    'dashboardCore.paymentsSettings.undoChanges': 'Undo changes',
    'dashboardCore.paymentsSettings.resetToDefaults': 'Reset to defaults',
    'dashboardCore.paymentsSettings.configurationEyebrow': 'Configuration',
    'dashboardCore.paymentsSettings.savedTargetsHeading': 'Saved targets',
    'dashboardCore.paymentsSettings.lastSavedValues':
      'Last values successfully saved.',
    'dashboardCore.paymentsSettings.persisted': 'Persisted',
    'dashboardCore.paymentsSettings.acceptanceShort': 'Acceptance',
    'dashboardCore.paymentsSettings.kitchenShort': 'Kitchen',
    'dashboardCore.paymentsSettings.waiterShort': 'Waiter',
    'dashboardCore.paymentsSettings.autoCalculatedFooter':
      'Total is automatically calculated from the three saved service targets.',
  },
  pt: {
    // layout.tsx — tab nav
    'dashboardCore.nav.menu': 'Menu',
    'dashboardCore.nav.tables': 'Mesas',
    'dashboardCore.nav.orders': 'Pedidos',
    'dashboardCore.nav.analytics': 'Análise',
    'dashboardCore.nav.kitchen': 'Cozinha',
    'dashboardCore.nav.waiter': 'Empregado',
    'dashboardCore.nav.waiters': 'Equipa',
    'dashboardCore.nav.payments': 'Pagamentos',
    'dashboardCore.nav.dashboard': 'Painel',
    'dashboardCore.nav.portalsHeading': 'Portais',

    // app/dashboard/[restaurantId]/page.tsx — hub
    'dashboardCore.hub.loading': 'A carregar restaurante...',
    'dashboardCore.hub.unavailableTitle': 'Restaurante indisponível',
    'dashboardCore.hub.couldNotLoadAccess':
      'Não foi possível carregar o acesso ao restaurante.',
    'dashboardCore.hub.noAccess': 'Não tem acesso a este restaurante.',
    'dashboardCore.hub.couldNotLoad':
      'Não foi possível carregar o restaurante.',
    'dashboardCore.hub.eyebrow': 'Restaurante',
    'dashboardCore.hub.whereToGo': 'Para onde quer ir?',
    'dashboardCore.hub.managerTitle': 'Gestão',
    'dashboardCore.hub.managerDescription':
      'Faça a gestão do menu, mesas, pedidos, equipa, análises e configurações.',
    'dashboardCore.hub.kitchenTitle': 'Cozinha',
    'dashboardCore.hub.kitchenDescription':
      'Veja os pedidos recebidos e faça a gestão da preparação na cozinha.',
    'dashboardCore.hub.waiterTitle': 'Empregado',
    'dashboardCore.hub.waiterDescription':
      'Sirva os pedidos, veja o estado das mesas e receba os pagamentos.',
    'dashboardCore.hub.enter': 'Entrar →',

    // app/dashboard/page.tsx — restaurant list
    'dashboardCore.list.title': 'Os seus restaurantes',
    'dashboardCore.list.newRestaurant': '+ Novo restaurante',
    'dashboardCore.list.namePlaceholder': 'Nome do restaurante',
    'dashboardCore.list.couldNotCreate':
      'Não foi possível criar o restaurante',
    'dashboardCore.list.loading': 'A carregar...',
    'dashboardCore.list.create': 'Criar',
    'dashboardCore.list.empty':
      'Ainda não tem restaurantes — crie o primeiro acima.',

    // settings/page.tsx
    'dashboardCore.settings.notConfigured': 'Não configurado',
    'dashboardCore.settings.loading': 'A carregar configurações...',
    'dashboardCore.settings.unableToLoad':
      'Não foi possível carregar as configurações do restaurante',
    'dashboardCore.settings.unableToLoadShort':
      'Não foi possível carregar as configurações',
    'dashboardCore.settings.unableToSave':
      'Não foi possível guardar as configurações',
    'dashboardCore.settings.savedSuccess':
      'Configurações guardadas com sucesso.',
    'dashboardCore.settings.title': 'Configurações',
    'dashboardCore.settings.subtitle':
      'Faça a gestão da configuração do restaurante, dos objetivos de serviço e das definições de avaliações de clientes.',
    'dashboardCore.settings.restaurantHeading': 'Restaurante',
    'dashboardCore.settings.restaurantSubtitle':
      'Informação básica sobre o seu restaurante.',
    'dashboardCore.settings.restaurantName': 'Nome do restaurante',
    'dashboardCore.settings.slug': 'Slug',
    'dashboardCore.settings.currency': 'Moeda',
    'dashboardCore.settings.timezone': 'Fuso horário',
    'dashboardCore.settings.googleReviewsHeading': 'Avaliações do Google',
    'dashboardCore.settings.googleReviewsSubtitle':
      'Defina o URL que os clientes devem usar para deixar uma avaliação no Google.',
    'dashboardCore.settings.googleReviewUrlLabel':
      'URL de avaliação do Google',
    'dashboardCore.settings.googleReviewHelp':
      'Este link poderá ser usado mais tarde no fluxo de avaliação/NFC após um pedido concluído.',
    'dashboardCore.settings.brandingHeading': 'Marca e estética',
    'dashboardCore.settings.brandingSubtitle':
      'Como o seu menu online é visto pelos clientes.',
    'dashboardCore.settings.brandColorLabel': 'Cor de destaque',
    'dashboardCore.settings.brandFontLabel': 'Tipografia',
    'dashboardCore.settings.brandFontDefault': 'Padrão (N2B)',
    'dashboardCore.settings.brandFontElegantScript': 'Elegante e clássico',
    'dashboardCore.settings.brandFontModernSerif': 'Serifa moderna',
    'dashboardCore.settings.brandFontRusticHandwritten': 'Rústico e artesanal',
    'dashboardCore.settings.brandFontBoldModern': 'Moderno e arrojado',
    'dashboardCore.settings.brandFontSample': 'O Seu Restaurante',
    'dashboardCore.settings.menuBackgroundLabel': 'Fundo do menu',
    'dashboardCore.settings.removeMenuBackground': 'Remover fundo',
    'dashboardCore.settings.menuBackgroundHelp':
      'Para o substituir por outra foto, volte a importar o menu a partir de fotos.',
    'dashboardCore.settings.menuFontScaleLabel': 'Tamanho do texto do menu',
    'dashboardCore.settings.menuFontScaleSmall': 'Pequeno',
    'dashboardCore.settings.menuFontScaleMedium': 'Médio',
    'dashboardCore.settings.menuFontScaleLarge': 'Grande',
    'dashboardCore.settings.menuLayoutModeLabel': 'Estilo do menu online',
    'dashboardCore.settings.menuLayoutModeList': 'Lista',
    'dashboardCore.settings.menuLayoutModePoster': 'Pôster (foto real)',
    'dashboardCore.settings.menuLayoutModeListHelp':
      'O menu aparece como uma lista, com a sua foto desfocada ao fundo.',
    'dashboardCore.settings.menuLayoutModePosterHelp':
      'O menu aparece sobre a sua foto real (sem desfoque), com cada prato colocado à mão onde você decidir.',
    'dashboardCore.settings.editPosterPositionsLink': 'Colocar os pratos na foto →',
    'dashboardCore.settings.menuBackgroundBlurLabel': 'Desfoque do fundo',
    'dashboardCore.settings.menuBackgroundTintLabel': 'Opacidade do véu',
    'dashboardCore.settings.staffJoinHeading': 'Acesso do pessoal',
    'dashboardCore.settings.staffJoinSubtitle':
      'Partilha esta palavra-passe com os teus empregados de mesa e cozinha para criarem a própria conta.',
    'dashboardCore.settings.staffJoinConfigured': 'Configurada',
    'dashboardCore.settings.staffJoinNotConfigured': 'Não configurada',
    'dashboardCore.settings.staffJoinLinkLabel': 'Link para aderir',
    'dashboardCore.settings.staffJoinSetPlaceholder': 'Criar palavra-passe (mín. 6 caracteres)',
    'dashboardCore.settings.staffJoinChangePlaceholder': 'Alterar palavra-passe',
    'dashboardCore.settings.staffJoinSave': 'Guardar',
    'dashboardCore.settings.staffJoinClear': 'Desativar',
    'dashboardCore.settings.staffJoinPasswordTooShort': 'Deve ter pelo menos 6 caracteres.',
    'dashboardCore.settings.slaHeading': 'Acordos de nível de serviço',
    'dashboardCore.settings.slaSubtitle':
      'Configure os objetivos usados pelas Análises para identificar um serviço lento.',
    'dashboardCore.settings.acceptanceLabel': 'Pedido → Aceite',
    'dashboardCore.settings.acceptedLabel': 'Aceite → Pronto',
    'dashboardCore.settings.readyLabel': 'Pronto → Servido',
    'dashboardCore.settings.staffResponseTime':
      'Tempo de resposta da equipa',
    'dashboardCore.settings.kitchenPrepTarget':
      'Objetivo de preparação na cozinha',
    'dashboardCore.settings.waiterDeliveryTarget':
      'Objetivo de entrega do empregado',
    'dashboardCore.settings.totalServiceSla': 'SLA de serviço total',
    'dashboardCore.settings.calculatedAutomatically':
      'Calculado automaticamente a partir das três fases do serviço.',
    'dashboardCore.settings.currentStatusHeading': 'Estado atual',
    'dashboardCore.settings.restaurantStatusLabel': 'Restaurante',
    'dashboardCore.settings.open': 'Aberto',
    'dashboardCore.settings.closed': 'Fechado',
    'dashboardCore.settings.restaurantStatusDescription':
      'Enquanto estiver fechado, os clientes não poderão enviar novos pedidos.',
    'dashboardCore.settings.accountLabel': 'Conta',
    'dashboardCore.settings.saveSettings': 'Guardar configurações',

    // settings/payments/page.tsx
    'dashboardCore.paymentsSettings.couldNotLoad':
      'Não foi possível carregar as configurações do restaurante',
    'dashboardCore.paymentsSettings.restaurantNotFound':
      'Restaurante não encontrado',
    'dashboardCore.paymentsSettings.couldNotStartStripe':
      'Não foi possível iniciar o registo no Stripe',
    'dashboardCore.paymentsSettings.couldNotSavePayment':
      'Não foi possível guardar as configurações de pagamento',
    'dashboardCore.paymentsSettings.couldNotSaveReview':
      'Não foi possível guardar o URL de avaliação',
    'dashboardCore.paymentsSettings.couldNotSaveSla':
      'Não foi possível guardar as configurações de SLA',
    'dashboardCore.paymentsSettings.slaAllRequired':
      'Introduza valores válidos para os três campos de SLA',
    'dashboardCore.paymentsSettings.acceptanceRange':
      'O SLA de aceitação deve estar entre 0,5 e 30 minutos',
    'dashboardCore.paymentsSettings.kitchenRange':
      'O SLA de cozinha deve estar entre 1 e 60 minutos',
    'dashboardCore.paymentsSettings.waiterRange':
      'O SLA de empregado deve estar entre 0,5 e 30 minutos',
    'dashboardCore.paymentsSettings.eyebrow':
      'Configurações do restaurante',
    'dashboardCore.paymentsSettings.title': 'Configurações',
    'dashboardCore.paymentsSettings.paymentsEyebrow': 'Pagamentos',
    'dashboardCore.paymentsSettings.stripeHeading': 'Stripe',
    'dashboardCore.paymentsSettings.stripeDescription':
      'Ligue a sua própria conta Stripe para que os pagamentos dos clientes sejam depositados diretamente a si. Fica com 100% da sua receita.',
    'dashboardCore.paymentsSettings.redirecting': 'A redirecionar...',
    'dashboardCore.paymentsSettings.connectStripe': 'Ligar conta Stripe',
    'dashboardCore.paymentsSettings.payAtRestaurantLabel':
      'Pagar no restaurante',
    'dashboardCore.paymentsSettings.payAtRestaurantDescription':
      'Permita que os clientes terminem a refeição pagando pessoalmente (dinheiro, cartão ou outro) em vez de usar o checkout do Stripe. A equipa confirma o recebimento a partir do painel de pedidos.',
    'dashboardCore.paymentsSettings.customerExperienceEyebrow':
      'Experiência do cliente',
    'dashboardCore.paymentsSettings.googleReviewsHeading':
      'Avaliações do Google',
    'dashboardCore.paymentsSettings.googleReviewsDescription':
      'Depois de o cliente pagar a conta completa da mesa, será enviado para este link de avaliação do Google.',
    'dashboardCore.paymentsSettings.saveReviewLink':
      'Guardar link de avaliação',
    'dashboardCore.paymentsSettings.serviceIntelligenceEyebrow':
      'Inteligência de serviço',
    'dashboardCore.paymentsSettings.slaHeading':
      'Acordos de nível de serviço',
    'dashboardCore.paymentsSettings.slaDescription':
      'Edite os objetivos de serviço abaixo. As alterações só ficam ativas depois de pressionar Guardar.',
    'dashboardCore.paymentsSettings.orderAcceptanceLabel':
      'Aceitação de pedidos',
    'dashboardCore.paymentsSettings.createdToAccepted': 'Criado → Aceite',
    'dashboardCore.paymentsSettings.minutes': 'minutos',
    'dashboardCore.paymentsSettings.savedValue': 'Valor guardado:',
    'dashboardCore.paymentsSettings.kitchenServiceLabel':
      'Serviço de cozinha',
    'dashboardCore.paymentsSettings.acceptedToReady': 'Aceite → Pronto',
    'dashboardCore.paymentsSettings.waiterDeliveryLabel':
      'Entrega do empregado',
    'dashboardCore.paymentsSettings.readyToServed': 'Pronto → Servido',
    'dashboardCore.paymentsSettings.totalServiceLabel': 'Serviço total',
    'dashboardCore.paymentsSettings.createdToServed': 'Criado → Servido',
    'dashboardCore.paymentsSettings.automatic': 'Automático',
    'dashboardCore.paymentsSettings.currentDraft':
      'Rascunho atual: {{acceptance}} + {{kitchen}} + {{waiter}} minutos',
    'dashboardCore.paymentsSettings.saveSla': 'Guardar configurações de SLA',
    'dashboardCore.paymentsSettings.undoChanges': 'Desfazer alterações',
    'dashboardCore.paymentsSettings.resetToDefaults': 'Repor predefinições',
    'dashboardCore.paymentsSettings.configurationEyebrow': 'Configuração',
    'dashboardCore.paymentsSettings.savedTargetsHeading':
      'Objetivos guardados',
    'dashboardCore.paymentsSettings.lastSavedValues':
      'Últimos valores guardados com sucesso.',
    'dashboardCore.paymentsSettings.persisted': 'Persistente',
    'dashboardCore.paymentsSettings.acceptanceShort': 'Aceitação',
    'dashboardCore.paymentsSettings.kitchenShort': 'Cozinha',
    'dashboardCore.paymentsSettings.waiterShort': 'Empregado',
    'dashboardCore.paymentsSettings.autoCalculatedFooter':
      'O total é calculado automaticamente a partir dos três objetivos de serviço guardados.',
  },
  de: {
    // layout.tsx — tab nav
    'dashboardCore.nav.menu': 'Menü',
    'dashboardCore.nav.tables': 'Tische',
    'dashboardCore.nav.orders': 'Bestellungen',
    'dashboardCore.nav.analytics': 'Analysen',
    'dashboardCore.nav.kitchen': 'Küche',
    'dashboardCore.nav.waiter': 'Kellner',
    'dashboardCore.nav.waiters': 'Personal',
    'dashboardCore.nav.payments': 'Zahlungen',
    'dashboardCore.nav.dashboard': 'Übersicht',
    'dashboardCore.nav.portalsHeading': 'Portale',

    // app/dashboard/[restaurantId]/page.tsx — hub
    'dashboardCore.hub.loading': 'Restaurant wird geladen...',
    'dashboardCore.hub.unavailableTitle': 'Restaurant nicht verfügbar',
    'dashboardCore.hub.couldNotLoadAccess':
      'Der Zugriff auf das Restaurant konnte nicht geladen werden.',
    'dashboardCore.hub.noAccess':
      'Du hast keinen Zugriff auf dieses Restaurant.',
    'dashboardCore.hub.couldNotLoad':
      'Das Restaurant konnte nicht geladen werden.',
    'dashboardCore.hub.eyebrow': 'Restaurant',
    'dashboardCore.hub.whereToGo': 'Wohin möchtest du gehen?',
    'dashboardCore.hub.managerTitle': 'Verwaltung',
    'dashboardCore.hub.managerDescription':
      'Verwalte Menü, Tische, Bestellungen, Personal, Analysen und Einstellungen.',
    'dashboardCore.hub.kitchenTitle': 'Küche',
    'dashboardCore.hub.kitchenDescription':
      'Sieh eingehende Bestellungen ein und verwalte die Küchenvorbereitung.',
    'dashboardCore.hub.waiterTitle': 'Kellner',
    'dashboardCore.hub.waiterDescription':
      'Bediene Bestellungen, sieh den Tischstatus ein und nimm Zahlungen entgegen.',
    'dashboardCore.hub.enter': 'Öffnen →',

    // app/dashboard/page.tsx — restaurant list
    'dashboardCore.list.title': 'Deine Restaurants',
    'dashboardCore.list.newRestaurant': '+ Neues Restaurant',
    'dashboardCore.list.namePlaceholder': 'Restaurantname',
    'dashboardCore.list.couldNotCreate':
      'Das Restaurant konnte nicht erstellt werden',
    'dashboardCore.list.loading': 'Wird geladen...',
    'dashboardCore.list.create': 'Erstellen',
    'dashboardCore.list.empty':
      'Noch keine Restaurants — erstelle dein erstes oben.',

    // settings/page.tsx
    'dashboardCore.settings.notConfigured': 'Nicht konfiguriert',
    'dashboardCore.settings.loading': 'Einstellungen werden geladen...',
    'dashboardCore.settings.unableToLoad':
      'Die Restaurant-Einstellungen konnten nicht geladen werden',
    'dashboardCore.settings.unableToLoadShort':
      'Die Einstellungen konnten nicht geladen werden',
    'dashboardCore.settings.unableToSave':
      'Die Einstellungen konnten nicht gespeichert werden',
    'dashboardCore.settings.savedSuccess':
      'Einstellungen erfolgreich gespeichert.',
    'dashboardCore.settings.title': 'Einstellungen',
    'dashboardCore.settings.subtitle':
      'Verwalte die Restaurantkonfiguration, Serviceziele und Kundenbewertungseinstellungen.',
    'dashboardCore.settings.restaurantHeading': 'Restaurant',
    'dashboardCore.settings.restaurantSubtitle':
      'Grundlegende Informationen über dein Restaurant.',
    'dashboardCore.settings.restaurantName': 'Restaurantname',
    'dashboardCore.settings.slug': 'Slug',
    'dashboardCore.settings.currency': 'Währung',
    'dashboardCore.settings.timezone': 'Zeitzone',
    'dashboardCore.settings.googleReviewsHeading': 'Google-Bewertungen',
    'dashboardCore.settings.googleReviewsSubtitle':
      'Lege die URL fest, die Kunden verwenden sollen, um eine Google-Bewertung zu hinterlassen.',
    'dashboardCore.settings.googleReviewUrlLabel': 'Google-Bewertungs-URL',
    'dashboardCore.settings.googleReviewHelp':
      'Dieser Link kann später im Bewertungs-/NFC-Ablauf nach einer abgeschlossenen Bestellung verwendet werden.',
    'dashboardCore.settings.brandingHeading': 'Marke & Erscheinungsbild',
    'dashboardCore.settings.brandingSubtitle':
      'So sieht deine Online-Speisekarte für Kunden aus.',
    'dashboardCore.settings.brandColorLabel': 'Akzentfarbe',
    'dashboardCore.settings.brandFontLabel': 'Typografie',
    'dashboardCore.settings.brandFontDefault': 'Standard (N2B)',
    'dashboardCore.settings.brandFontElegantScript': 'Elegant & klassisch',
    'dashboardCore.settings.brandFontModernSerif': 'Moderne Serife',
    'dashboardCore.settings.brandFontRusticHandwritten': 'Rustikal & handschriftlich',
    'dashboardCore.settings.brandFontBoldModern': 'Kräftig & modern',
    'dashboardCore.settings.brandFontSample': 'Dein Restaurant',
    'dashboardCore.settings.menuBackgroundLabel': 'Speisekarten-Hintergrund',
    'dashboardCore.settings.removeMenuBackground': 'Hintergrund entfernen',
    'dashboardCore.settings.menuBackgroundHelp':
      'Um ihn durch ein anderes Foto zu ersetzen, importiere die Speisekarte erneut aus Fotos.',
    'dashboardCore.settings.menuFontScaleLabel': 'Textgröße der Speisekarte',
    'dashboardCore.settings.menuFontScaleSmall': 'Klein',
    'dashboardCore.settings.menuFontScaleMedium': 'Mittel',
    'dashboardCore.settings.menuFontScaleLarge': 'Groß',
    'dashboardCore.settings.menuLayoutModeLabel': 'Stil der Online-Speisekarte',
    'dashboardCore.settings.menuLayoutModeList': 'Liste',
    'dashboardCore.settings.menuLayoutModePoster': 'Poster (echtes Foto)',
    'dashboardCore.settings.menuLayoutModeListHelp':
      'Die Speisekarte wird als Liste angezeigt, mit deinem unscharfen Foto im Hintergrund.',
    'dashboardCore.settings.menuLayoutModePosterHelp':
      'Die Speisekarte wird über deinem echten Foto angezeigt (nicht unscharf), mit jedem Gericht von Hand platziert.',
    'dashboardCore.settings.editPosterPositionsLink': 'Gerichte auf dem Foto platzieren →',
    'dashboardCore.settings.menuBackgroundBlurLabel': 'Hintergrundunschärfe',
    'dashboardCore.settings.menuBackgroundTintLabel': 'Deckkraft der Schleier',
    'dashboardCore.settings.staffJoinHeading': 'Personalzugang',
    'dashboardCore.settings.staffJoinSubtitle':
      'Teile dieses Passwort mit deinen Kellnern und der Küche, damit sie ihr eigenes Konto erstellen können.',
    'dashboardCore.settings.staffJoinConfigured': 'Eingerichtet',
    'dashboardCore.settings.staffJoinNotConfigured': 'Nicht eingerichtet',
    'dashboardCore.settings.staffJoinLinkLabel': 'Link zum Beitreten',
    'dashboardCore.settings.staffJoinSetPlaceholder': 'Passwort festlegen (mind. 6 Zeichen)',
    'dashboardCore.settings.staffJoinChangePlaceholder': 'Passwort ändern',
    'dashboardCore.settings.staffJoinSave': 'Speichern',
    'dashboardCore.settings.staffJoinClear': 'Deaktivieren',
    'dashboardCore.settings.staffJoinPasswordTooShort': 'Muss mindestens 6 Zeichen haben.',
    'dashboardCore.settings.slaHeading': 'Service-Level-Agreements',
    'dashboardCore.settings.slaSubtitle':
      'Konfiguriere die Ziele, die von den Analysen verwendet werden, um langsamen Service zu erkennen.',
    'dashboardCore.settings.acceptanceLabel': 'Bestellung → Angenommen',
    'dashboardCore.settings.acceptedLabel': 'Angenommen → Fertig',
    'dashboardCore.settings.readyLabel': 'Fertig → Serviert',
    'dashboardCore.settings.staffResponseTime':
      'Reaktionszeit des Personals',
    'dashboardCore.settings.kitchenPrepTarget':
      'Ziel für die Küchenvorbereitung',
    'dashboardCore.settings.waiterDeliveryTarget':
      'Ziel für die Kellner-Zustellung',
    'dashboardCore.settings.totalServiceSla': 'Gesamt-Service-SLA',
    'dashboardCore.settings.calculatedAutomatically':
      'Wird automatisch aus den drei Servicephasen berechnet.',
    'dashboardCore.settings.currentStatusHeading': 'Aktueller Status',
    'dashboardCore.settings.restaurantStatusLabel': 'Restaurant',
    'dashboardCore.settings.open': 'Geöffnet',
    'dashboardCore.settings.closed': 'Geschlossen',
    'dashboardCore.settings.restaurantStatusDescription':
      'Solange geschlossen ist, können Kunden keine neuen Bestellungen aufgeben.',
    'dashboardCore.settings.accountLabel': 'Konto',
    'dashboardCore.settings.saveSettings': 'Einstellungen speichern',

    // settings/payments/page.tsx
    'dashboardCore.paymentsSettings.couldNotLoad':
      'Die Restaurant-Einstellungen konnten nicht geladen werden',
    'dashboardCore.paymentsSettings.restaurantNotFound':
      'Restaurant nicht gefunden',
    'dashboardCore.paymentsSettings.couldNotStartStripe':
      'Die Stripe-Einrichtung konnte nicht gestartet werden',
    'dashboardCore.paymentsSettings.couldNotSavePayment':
      'Die Zahlungseinstellungen konnten nicht gespeichert werden',
    'dashboardCore.paymentsSettings.couldNotSaveReview':
      'Die Bewertungs-URL konnte nicht gespeichert werden',
    'dashboardCore.paymentsSettings.couldNotSaveSla':
      'Die SLA-Einstellungen konnten nicht gespeichert werden',
    'dashboardCore.paymentsSettings.slaAllRequired':
      'Bitte gib gültige Werte für alle drei SLA-Felder ein',
    'dashboardCore.paymentsSettings.acceptanceRange':
      'Das Annahme-SLA muss zwischen 0,5 und 30 Minuten liegen',
    'dashboardCore.paymentsSettings.kitchenRange':
      'Das Küchen-SLA muss zwischen 1 und 60 Minuten liegen',
    'dashboardCore.paymentsSettings.waiterRange':
      'Das Kellner-SLA muss zwischen 0,5 und 30 Minuten liegen',
    'dashboardCore.paymentsSettings.eyebrow': 'Restaurant-Einstellungen',
    'dashboardCore.paymentsSettings.title': 'Einstellungen',
    'dashboardCore.paymentsSettings.paymentsEyebrow': 'Zahlungen',
    'dashboardCore.paymentsSettings.stripeHeading': 'Stripe',
    'dashboardCore.paymentsSettings.stripeDescription':
      'Verbinde dein eigenes Stripe-Konto, damit Kundenzahlungen direkt an dich ausgezahlt werden. Du behältst 100 % deiner Einnahmen.',
    'dashboardCore.paymentsSettings.redirecting': 'Weiterleitung...',
    'dashboardCore.paymentsSettings.connectStripe': 'Stripe-Konto verbinden',
    'dashboardCore.paymentsSettings.payAtRestaurantLabel':
      'Vor Ort bezahlen',
    'dashboardCore.paymentsSettings.payAtRestaurantDescription':
      'Lass Kunden ihre Mahlzeit abschließen, indem sie persönlich bezahlen (bar, Karte oder anders) statt über Stripe. Das Personal bestätigt den Zahlungseingang im Bestell-Dashboard.',
    'dashboardCore.paymentsSettings.customerExperienceEyebrow':
      'Kundenerlebnis',
    'dashboardCore.paymentsSettings.googleReviewsHeading':
      'Google-Bewertungen',
    'dashboardCore.paymentsSettings.googleReviewsDescription':
      'Nachdem der Kunde die vollständige Tischrechnung bezahlt hat, wird er zu diesem Google-Bewertungslink weitergeleitet.',
    'dashboardCore.paymentsSettings.saveReviewLink': 'Bewertungslink speichern',
    'dashboardCore.paymentsSettings.serviceIntelligenceEyebrow':
      'Service-Intelligenz',
    'dashboardCore.paymentsSettings.slaHeading':
      'Service-Level-Agreements',
    'dashboardCore.paymentsSettings.slaDescription':
      'Bearbeite die Serviceziele unten. Änderungen werden erst aktiv, nachdem du auf Speichern klickst.',
    'dashboardCore.paymentsSettings.orderAcceptanceLabel': 'Bestellannahme',
    'dashboardCore.paymentsSettings.createdToAccepted':
      'Erstellt → Angenommen',
    'dashboardCore.paymentsSettings.minutes': 'Minuten',
    'dashboardCore.paymentsSettings.savedValue': 'Gespeicherter Wert:',
    'dashboardCore.paymentsSettings.kitchenServiceLabel': 'Küchenservice',
    'dashboardCore.paymentsSettings.acceptedToReady': 'Angenommen → Fertig',
    'dashboardCore.paymentsSettings.waiterDeliveryLabel':
      'Kellner-Zustellung',
    'dashboardCore.paymentsSettings.readyToServed': 'Fertig → Serviert',
    'dashboardCore.paymentsSettings.totalServiceLabel': 'Gesamtservice',
    'dashboardCore.paymentsSettings.createdToServed': 'Erstellt → Serviert',
    'dashboardCore.paymentsSettings.automatic': 'Automatisch',
    'dashboardCore.paymentsSettings.currentDraft':
      'Aktueller Entwurf: {{acceptance}} + {{kitchen}} + {{waiter}} Minuten',
    'dashboardCore.paymentsSettings.saveSla': 'SLA-Einstellungen speichern',
    'dashboardCore.paymentsSettings.undoChanges':
      'Änderungen rückgängig machen',
    'dashboardCore.paymentsSettings.resetToDefaults':
      'Auf Standardwerte zurücksetzen',
    'dashboardCore.paymentsSettings.configurationEyebrow': 'Konfiguration',
    'dashboardCore.paymentsSettings.savedTargetsHeading':
      'Gespeicherte Ziele',
    'dashboardCore.paymentsSettings.lastSavedValues':
      'Zuletzt erfolgreich gespeicherte Werte.',
    'dashboardCore.paymentsSettings.persisted': 'Gespeichert',
    'dashboardCore.paymentsSettings.acceptanceShort': 'Annahme',
    'dashboardCore.paymentsSettings.kitchenShort': 'Küche',
    'dashboardCore.paymentsSettings.waiterShort': 'Kellner',
    'dashboardCore.paymentsSettings.autoCalculatedFooter':
      'Der Gesamtwert wird automatisch aus den drei gespeicherten Servicezielen berechnet.',
  },
  fr: {
    // layout.tsx — tab nav
    'dashboardCore.nav.menu': 'Menu',
    'dashboardCore.nav.tables': 'Tables',
    'dashboardCore.nav.orders': 'Commandes',
    'dashboardCore.nav.analytics': 'Statistiques',
    'dashboardCore.nav.kitchen': 'Cuisine',
    'dashboardCore.nav.waiter': 'Serveur',
    'dashboardCore.nav.waiters': 'Personnel',
    'dashboardCore.nav.payments': 'Paiements',
    'dashboardCore.nav.dashboard': 'Tableau de bord',
    'dashboardCore.nav.portalsHeading': 'Portails',

    // app/dashboard/[restaurantId]/page.tsx — hub
    'dashboardCore.hub.loading': 'Chargement du restaurant...',
    'dashboardCore.hub.unavailableTitle': 'Restaurant indisponible',
    'dashboardCore.hub.couldNotLoadAccess':
      "Impossible de charger l'accès au restaurant.",
    'dashboardCore.hub.noAccess': "Vous n'avez pas accès à ce restaurant.",
    'dashboardCore.hub.couldNotLoad': 'Impossible de charger le restaurant.',
    'dashboardCore.hub.eyebrow': 'Restaurant',
    'dashboardCore.hub.whereToGo': 'Où voulez-vous aller ?',
    'dashboardCore.hub.managerTitle': 'Gestion',
    'dashboardCore.hub.managerDescription':
      'Gérez le menu, les tables, les commandes, le personnel, les statistiques et les paramètres.',
    'dashboardCore.hub.kitchenTitle': 'Cuisine',
    'dashboardCore.hub.kitchenDescription':
      'Consultez les commandes entrantes et gérez la préparation en cuisine.',
    'dashboardCore.hub.waiterTitle': 'Serveur',
    'dashboardCore.hub.waiterDescription':
      "Servez les commandes, consultez l'état des tables et encaissez les paiements.",
    'dashboardCore.hub.enter': 'Entrer →',

    // app/dashboard/page.tsx — restaurant list
    'dashboardCore.list.title': 'Vos restaurants',
    'dashboardCore.list.newRestaurant': '+ Nouveau restaurant',
    'dashboardCore.list.namePlaceholder': 'Nom du restaurant',
    'dashboardCore.list.couldNotCreate': 'Impossible de créer le restaurant',
    'dashboardCore.list.loading': 'Chargement...',
    'dashboardCore.list.create': 'Créer',
    'dashboardCore.list.empty':
      "Aucun restaurant pour l'instant — créez le premier ci-dessus.",

    // settings/page.tsx
    'dashboardCore.settings.notConfigured': 'Non configuré',
    'dashboardCore.settings.loading': 'Chargement des paramètres...',
    'dashboardCore.settings.unableToLoad':
      'Impossible de charger les paramètres du restaurant',
    'dashboardCore.settings.unableToLoadShort':
      'Impossible de charger les paramètres',
    'dashboardCore.settings.unableToSave':
      "Impossible d'enregistrer les paramètres",
    'dashboardCore.settings.savedSuccess':
      'Paramètres enregistrés avec succès.',
    'dashboardCore.settings.title': 'Paramètres',
    'dashboardCore.settings.subtitle':
      "Gérez la configuration du restaurant, les objectifs de service et les paramètres d'avis clients.",
    'dashboardCore.settings.restaurantHeading': 'Restaurant',
    'dashboardCore.settings.restaurantSubtitle':
      'Informations de base sur votre restaurant.',
    'dashboardCore.settings.restaurantName': 'Nom du restaurant',
    'dashboardCore.settings.slug': 'Slug',
    'dashboardCore.settings.currency': 'Devise',
    'dashboardCore.settings.timezone': 'Fuseau horaire',
    'dashboardCore.settings.googleReviewsHeading': 'Avis Google',
    'dashboardCore.settings.googleReviewsSubtitle':
      "Définissez l'URL que les clients doivent utiliser pour laisser un avis Google.",
    'dashboardCore.settings.googleReviewUrlLabel': "URL de l'avis Google",
    'dashboardCore.settings.googleReviewHelp':
      "Ce lien pourra ensuite être utilisé dans le flux d'avis/NFC après une commande terminée.",
    'dashboardCore.settings.brandingHeading': 'Marque & esthétique',
    'dashboardCore.settings.brandingSubtitle':
      'L\'apparence de votre menu en ligne pour les clients.',
    'dashboardCore.settings.brandColorLabel': "Couleur d'accent",
    'dashboardCore.settings.brandFontLabel': 'Typographie',
    'dashboardCore.settings.brandFontDefault': 'Par défaut (N2B)',
    'dashboardCore.settings.brandFontElegantScript': 'Élégant et classique',
    'dashboardCore.settings.brandFontModernSerif': 'Serif moderne',
    'dashboardCore.settings.brandFontRusticHandwritten': 'Rustique et manuscrit',
    'dashboardCore.settings.brandFontBoldModern': 'Audacieux et moderne',
    'dashboardCore.settings.brandFontSample': 'Votre Restaurant',
    'dashboardCore.settings.menuBackgroundLabel': 'Arrière-plan du menu',
    'dashboardCore.settings.removeMenuBackground': "Retirer l'arrière-plan",
    'dashboardCore.settings.menuBackgroundHelp':
      "Pour le remplacer par une autre photo, réimportez le menu à partir de photos.",
    'dashboardCore.settings.menuFontScaleLabel': 'Taille du texte du menu',
    'dashboardCore.settings.menuFontScaleSmall': 'Petit',
    'dashboardCore.settings.menuFontScaleMedium': 'Moyen',
    'dashboardCore.settings.menuFontScaleLarge': 'Grand',
    'dashboardCore.settings.menuLayoutModeLabel': 'Style du menu en ligne',
    'dashboardCore.settings.menuLayoutModeList': 'Liste',
    'dashboardCore.settings.menuLayoutModePoster': 'Affiche (photo réelle)',
    'dashboardCore.settings.menuLayoutModeListHelp':
      'Le menu s\'affiche sous forme de liste, avec votre photo floutée en arrière-plan.',
    'dashboardCore.settings.menuLayoutModePosterHelp':
      'Le menu s\'affiche sur votre photo réelle (non floutée), avec chaque plat placé à la main où vous le souhaitez.',
    'dashboardCore.settings.editPosterPositionsLink': 'Placer les plats sur la photo →',
    'dashboardCore.settings.menuBackgroundBlurLabel': 'Flou de l\'arrière-plan',
    'dashboardCore.settings.menuBackgroundTintLabel': 'Opacité du voile',
    'dashboardCore.settings.staffJoinHeading': 'Accès du personnel',
    'dashboardCore.settings.staffJoinSubtitle':
      'Partagez ce mot de passe avec vos serveurs et votre cuisine pour qu\'ils créent leur propre compte.',
    'dashboardCore.settings.staffJoinConfigured': 'Configuré',
    'dashboardCore.settings.staffJoinNotConfigured': 'Non configuré',
    'dashboardCore.settings.staffJoinLinkLabel': 'Lien pour rejoindre',
    'dashboardCore.settings.staffJoinSetPlaceholder': 'Définir un mot de passe (min. 6 caractères)',
    'dashboardCore.settings.staffJoinChangePlaceholder': 'Changer le mot de passe',
    'dashboardCore.settings.staffJoinSave': 'Enregistrer',
    'dashboardCore.settings.staffJoinClear': 'Désactiver',
    'dashboardCore.settings.staffJoinPasswordTooShort': 'Doit contenir au moins 6 caractères.',
    'dashboardCore.settings.slaHeading': 'Accords de niveau de service',
    'dashboardCore.settings.slaSubtitle':
      'Configurez les objectifs utilisés par les statistiques pour identifier un service lent.',
    'dashboardCore.settings.acceptanceLabel': 'Commande → Acceptée',
    'dashboardCore.settings.acceptedLabel': 'Acceptée → Prête',
    'dashboardCore.settings.readyLabel': 'Prête → Servie',
    'dashboardCore.settings.staffResponseTime':
      'Temps de réponse du personnel',
    'dashboardCore.settings.kitchenPrepTarget':
      'Objectif de préparation en cuisine',
    'dashboardCore.settings.waiterDeliveryTarget':
      'Objectif de livraison du serveur',
    'dashboardCore.settings.totalServiceSla': 'SLA de service total',
    'dashboardCore.settings.calculatedAutomatically':
      'Calculé automatiquement à partir des trois étapes de service.',
    'dashboardCore.settings.currentStatusHeading': 'État actuel',
    'dashboardCore.settings.restaurantStatusLabel': 'Restaurant',
    'dashboardCore.settings.open': 'Ouvert',
    'dashboardCore.settings.closed': 'Fermé',
    'dashboardCore.settings.restaurantStatusDescription':
      'Tant que le restaurant est fermé, les clients ne pourront pas passer de nouvelles commandes.',
    'dashboardCore.settings.accountLabel': 'Compte',
    'dashboardCore.settings.saveSettings': 'Enregistrer les paramètres',

    // settings/payments/page.tsx
    'dashboardCore.paymentsSettings.couldNotLoad':
      'Impossible de charger les paramètres du restaurant',
    'dashboardCore.paymentsSettings.restaurantNotFound':
      'Restaurant introuvable',
    'dashboardCore.paymentsSettings.couldNotStartStripe':
      "Impossible de démarrer l'intégration Stripe",
    'dashboardCore.paymentsSettings.couldNotSavePayment':
      "Impossible d'enregistrer les paramètres de paiement",
    'dashboardCore.paymentsSettings.couldNotSaveReview':
      "Impossible d'enregistrer le lien d'avis",
    'dashboardCore.paymentsSettings.couldNotSaveSla':
      "Impossible d'enregistrer les paramètres SLA",
    'dashboardCore.paymentsSettings.slaAllRequired':
      'Veuillez saisir des valeurs valides pour les trois champs SLA',
    'dashboardCore.paymentsSettings.acceptanceRange':
      "Le SLA d'acceptation doit être compris entre 0,5 et 30 minutes",
    'dashboardCore.paymentsSettings.kitchenRange':
      'Le SLA de cuisine doit être compris entre 1 et 60 minutes',
    'dashboardCore.paymentsSettings.waiterRange':
      'Le SLA de serveur doit être compris entre 0,5 et 30 minutes',
    'dashboardCore.paymentsSettings.eyebrow': 'Paramètres du restaurant',
    'dashboardCore.paymentsSettings.title': 'Paramètres',
    'dashboardCore.paymentsSettings.paymentsEyebrow': 'Paiements',
    'dashboardCore.paymentsSettings.stripeHeading': 'Stripe',
    'dashboardCore.paymentsSettings.stripeDescription':
      'Connectez votre propre compte Stripe pour que les paiements des clients vous soient versés directement. Vous conservez 100 % de vos revenus.',
    'dashboardCore.paymentsSettings.redirecting': 'Redirection...',
    'dashboardCore.paymentsSettings.connectStripe':
      'Connecter un compte Stripe',
    'dashboardCore.paymentsSettings.payAtRestaurantLabel':
      'Payer sur place',
    'dashboardCore.paymentsSettings.payAtRestaurantDescription':
      'Permettez aux clients de terminer leur repas en payant sur place (espèces, carte ou autre) au lieu de passer par Stripe. Le personnel confirme l\'encaissement depuis le tableau de bord des commandes.',
    'dashboardCore.paymentsSettings.customerExperienceEyebrow':
      'Expérience client',
    'dashboardCore.paymentsSettings.googleReviewsHeading': 'Avis Google',
    'dashboardCore.paymentsSettings.googleReviewsDescription':
      "Une fois que le client a payé l'addition complète de la table, il sera redirigé vers ce lien d'avis Google.",
    'dashboardCore.paymentsSettings.saveReviewLink': "Enregistrer le lien d'avis",
    'dashboardCore.paymentsSettings.serviceIntelligenceEyebrow':
      'Intelligence de service',
    'dashboardCore.paymentsSettings.slaHeading':
      'Accords de niveau de service',
    'dashboardCore.paymentsSettings.slaDescription':
      "Modifiez les objectifs de service ci-dessous. Les changements ne deviennent actifs qu'après avoir appuyé sur Enregistrer.",
    'dashboardCore.paymentsSettings.orderAcceptanceLabel':
      'Acceptation de commande',
    'dashboardCore.paymentsSettings.createdToAccepted': 'Créée → Acceptée',
    'dashboardCore.paymentsSettings.minutes': 'minutes',
    'dashboardCore.paymentsSettings.savedValue': 'Valeur enregistrée :',
    'dashboardCore.paymentsSettings.kitchenServiceLabel':
      'Service en cuisine',
    'dashboardCore.paymentsSettings.acceptedToReady': 'Acceptée → Prête',
    'dashboardCore.paymentsSettings.waiterDeliveryLabel':
      'Livraison du serveur',
    'dashboardCore.paymentsSettings.readyToServed': 'Prête → Servie',
    'dashboardCore.paymentsSettings.totalServiceLabel': 'Service total',
    'dashboardCore.paymentsSettings.createdToServed': 'Créée → Servie',
    'dashboardCore.paymentsSettings.automatic': 'Automatique',
    'dashboardCore.paymentsSettings.currentDraft':
      'Brouillon actuel : {{acceptance}} + {{kitchen}} + {{waiter}} minutes',
    'dashboardCore.paymentsSettings.saveSla':
      'Enregistrer les paramètres SLA',
    'dashboardCore.paymentsSettings.undoChanges':
      'Annuler les modifications',
    'dashboardCore.paymentsSettings.resetToDefaults':
      'Réinitialiser aux valeurs par défaut',
    'dashboardCore.paymentsSettings.configurationEyebrow': 'Configuration',
    'dashboardCore.paymentsSettings.savedTargetsHeading':
      'Objectifs enregistrés',
    'dashboardCore.paymentsSettings.lastSavedValues':
      'Dernières valeurs enregistrées avec succès.',
    'dashboardCore.paymentsSettings.persisted': 'Persistant',
    'dashboardCore.paymentsSettings.acceptanceShort': 'Acceptation',
    'dashboardCore.paymentsSettings.kitchenShort': 'Cuisine',
    'dashboardCore.paymentsSettings.waiterShort': 'Serveur',
    'dashboardCore.paymentsSettings.autoCalculatedFooter':
      'Le total est calculé automatiquement à partir des trois objectifs de service enregistrés.',
  },
};
