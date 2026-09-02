import type { Locale } from '../locales';

/**
 * Staff select/tables screens, StaffPortalLogin.tsx, and the Kitchen
 * display: app/staff/[restaurantId]/select/page.tsx,
 * app/staff/[restaurantId]/tables/page.tsx, components/StaffPortalLogin.tsx,
 * app/kitchen/[restaurantId]/page.tsx.
 */
export const staffMisc: Record<Locale, Record<string, string>> = {
  es: {
    // select/page.tsx
    'staffMisc.select.eyebrow': 'Camarero',
    'staffMisc.select.unavailableTitle': 'Camareros no disponibles',
    'staffMisc.select.couldNotLoadAccess':
      'No se pudo cargar el acceso al restaurante.',
    'staffMisc.select.couldNotLoadWaiters':
      'No se pudieron cargar los camareros.',
    'staffMisc.select.noAccess': 'No tienes acceso a este restaurante.',
    'staffMisc.select.chooseWaiter': 'Elige un camarero',
    'staffMisc.select.chooseWaiterDesc':
      'Selecciona la sesión de camarero que quieres abrir.',
    'staffMisc.select.noWaiters': 'No hay camareros creados',
    'staffMisc.select.noWaitersDesc':
      'El gerente debe crear primero las cuentas de camarero.',
    'staffMisc.select.manageWaiters': 'Gestionar camareros',
    'staffMisc.select.waiterNumber': 'Camarero {{number}}',
    'staffMisc.select.openSession': 'Abrir sesión →',

    // tables/page.tsx
    'staffMisc.tables.loadingTables': 'Cargando mesas...',
    'staffMisc.tables.couldNotLoadTables': 'No se pudieron cargar las mesas',
    'staffMisc.tables.couldNotLoadAssignments':
      'No se pudieron cargar las asignaciones',
    'staffMisc.tables.couldNotLoadStatus':
      'No se pudo cargar el estado de las mesas',
    'staffMisc.tables.couldNotAssignTable': 'No se pudo asignar la mesa',
    'staffMisc.tables.couldNotRemoveAssignment':
      'No se pudo quitar la asignación',
    'staffMisc.tables.liveFloorEyebrow': 'Sala en vivo',
    'staffMisc.tables.myTables': 'Mis mesas',
    'staffMisc.tables.myTablesDesc':
      'Consulta tus mesas asignadas y entérate al instante cuando un cliente solicite pagar.',
    'staffMisc.tables.backToWaiter': 'Volver al camarero',
    'staffMisc.tables.assignedToMe': 'Asignadas a mí',
    'staffMisc.tables.noneAssignedYet': 'Aún no tienes mesas asignadas.',
    'staffMisc.tables.rolePrimary': 'PRINCIPAL',
    'staffMisc.tables.roleAssisting': 'APOYO',
    'staffMisc.tables.assignMyselfOption': 'Asignarme una mesa...',
    'staffMisc.tables.assign': 'Asignar',
    'staffMisc.tables.liveStatusEyebrow': 'Estado de mesas en vivo',
    'staffMisc.tables.floorOverview': 'Vista general de la sala',
    'staffMisc.tables.currentBill': 'Cuenta actual',
    'staffMisc.tables.customerSelected': 'El cliente eligió',
    'staffMisc.tables.paymentMethodMissing': 'Falta el método de pago',
    'staffMisc.tables.goToPaymentRequest':
      'Ve a la solicitud de pago en el panel de camarero y confirma que la has recibido.',
    'staffMisc.tables.allOrdersServedReady':
      'Todos los pedidos están servidos. La mesa ya puede terminar la comida y pagar.',
    'staffMisc.tables.paymentConfirmed': 'El pago ya ha sido confirmado.',
    'staffMisc.tables.noTablesAssigned': 'Aún no tienes mesas asignadas.',
    'staffMisc.tables.cash': 'Efectivo',
    'staffMisc.tables.card': 'Tarjeta',
    'staffMisc.tables.other': 'Otro',
    'staffMisc.tables.changeDue': 'Cambio a devolver',
    'staffMisc.tables.changeDueAmount': 'Devolver {{amount}}',
    'staffMisc.tables.exactAmount': 'Importe exacto, sin cambio',
    'staffMisc.tables.tendered': 'El cliente paga con',
    'staffMisc.tables.splitBill': 'Cuenta dividida',
    'staffMisc.tables.perPersonChange': 'Cambio por persona',
    'staffMisc.tables.owes': 'Debe',
    'staffMisc.tables.noChangeInfo': 'El cliente no indicó con cuánto paga.',

    // StaffPortalLogin.tsx
    'staffMisc.login.checkingAccess': 'Comprobando el acceso...',
    'staffMisc.login.eyebrow': 'Acceso del personal del restaurante',
    'staffMisc.login.kitchenTitle': 'Cocina',
    'staffMisc.login.waiterTitle': 'Camarero',
    'staffMisc.login.signInDesc':
      'Inicia sesión con la cuenta creada por el gerente del restaurante.',
    'staffMisc.login.usernameEmail': 'Usuario / correo electrónico',
    'staffMisc.login.emailPlaceholderKitchen': 'cocina@restaurante.com',
    'staffMisc.login.emailPlaceholderWaiter': 'camarero@restaurante.com',
    'staffMisc.login.yourPasswordPlaceholder': 'Tu contraseña',
    'staffMisc.login.enterPortal': 'Entrar a {{portal}}',
    'staffMisc.login.couldNotSignIn': 'No se pudo iniciar sesión en {{portal}}.',

    // kitchen/[restaurantId]/page.tsx
    'staffMisc.kitchen.tableLabel': 'Mesa',
    'staffMisc.kitchen.justNow': 'Ahora mismo',
    'staffMisc.kitchen.oneMinAgo': 'Hace 1 min',
    'staffMisc.kitchen.minutesAgo': 'Hace {{minutes}} min',
    'staffMisc.kitchen.orderNumber': 'Pedido n.º {{number}}',
    'staffMisc.kitchen.updating': 'Actualizando...',
    'staffMisc.kitchen.couldNotLoadAccess':
      'No se pudo cargar el acceso al restaurante',
    'staffMisc.kitchen.noStaffAccess':
      'No tienes acceso de personal a este restaurante.',
    'staffMisc.kitchen.couldNotLoadOrders': 'No se pudieron cargar los pedidos',
    'staffMisc.kitchen.noAccess': 'No tienes acceso a este restaurante.',
    'staffMisc.kitchen.couldNotLoadKitchen': 'No se pudo cargar la cocina',
    'staffMisc.kitchen.couldNotUpdateOrder': 'No se pudo actualizar el pedido',
    'staffMisc.kitchen.title': 'Cocina',
    'staffMisc.kitchen.unavailableTitle': 'Cocina no disponible',
    'staffMisc.kitchen.live': 'En vivo',
    'staffMisc.kitchen.reconnecting': 'Reconectando',
    'staffMisc.kitchen.newOrders': 'Pedidos nuevos',
    'staffMisc.kitchen.accepted': 'Aceptados',
    'staffMisc.kitchen.preparing': 'En preparación',
    'staffMisc.kitchen.noNewOrders': 'No hay pedidos nuevos.',
    'staffMisc.kitchen.noAcceptedOrders': 'No hay pedidos aceptados.',
    'staffMisc.kitchen.nothingCooking':
      'No hay nada en preparación ahora mismo.',
    'staffMisc.kitchen.acceptOrder': 'Aceptar pedido',
    'staffMisc.kitchen.markUnavailable': 'No disponible',
    'staffMisc.kitchen.unavailableNotePlaceholder': 'Motivo (opcional)',
    'staffMisc.kitchen.confirmUnavailable': 'Confirmar',
    'staffMisc.kitchen.itemUnavailable': 'No disponible',
    'staffMisc.kitchen.startPreparing': 'Empezar a preparar',
    'staffMisc.kitchen.markReady': 'Marcar como listo',
  },
  en: {
    // select/page.tsx
    'staffMisc.select.eyebrow': 'Waiter',
    'staffMisc.select.unavailableTitle': 'Waiters unavailable',
    'staffMisc.select.couldNotLoadAccess':
      'Could not load restaurant access.',
    'staffMisc.select.couldNotLoadWaiters': 'Could not load waiters.',
    'staffMisc.select.noAccess': 'You do not have access to this restaurant.',
    'staffMisc.select.chooseWaiter': 'Choose waiter',
    'staffMisc.select.chooseWaiterDesc':
      'Select the waiter session you want to open.',
    'staffMisc.select.noWaiters': 'No waiters created',
    'staffMisc.select.noWaitersDesc':
      'The Manager needs to create waiter accounts first.',
    'staffMisc.select.manageWaiters': 'Manage waiters',
    'staffMisc.select.waiterNumber': 'Waiter {{number}}',
    'staffMisc.select.openSession': 'Open session →',

    // tables/page.tsx
    'staffMisc.tables.loadingTables': 'Loading tables...',
    'staffMisc.tables.couldNotLoadTables': 'Could not load tables',
    'staffMisc.tables.couldNotLoadAssignments':
      'Could not load assignments',
    'staffMisc.tables.couldNotLoadStatus': 'Could not load table status',
    'staffMisc.tables.couldNotAssignTable': 'Could not assign table',
    'staffMisc.tables.couldNotRemoveAssignment':
      'Could not remove assignment',
    'staffMisc.tables.liveFloorEyebrow': 'Live floor',
    'staffMisc.tables.myTables': 'My tables',
    'staffMisc.tables.myTablesDesc':
      'See your assigned tables and immediately know when a customer has requested payment.',
    'staffMisc.tables.backToWaiter': 'Back to waiter',
    'staffMisc.tables.assignedToMe': 'Assigned to me',
    'staffMisc.tables.noneAssignedYet': 'You have no tables assigned yet.',
    'staffMisc.tables.rolePrimary': 'PRIMARY',
    'staffMisc.tables.roleAssisting': 'ASSISTING',
    'staffMisc.tables.assignMyselfOption': 'Assign myself to a table...',
    'staffMisc.tables.assign': 'Assign',
    'staffMisc.tables.liveStatusEyebrow': 'Live table status',
    'staffMisc.tables.floorOverview': 'Floor overview',
    'staffMisc.tables.currentBill': 'Current bill',
    'staffMisc.tables.customerSelected': 'Customer selected',
    'staffMisc.tables.paymentMethodMissing': 'Payment method missing',
    'staffMisc.tables.goToPaymentRequest':
      'Go to the payment request on the waiter board and confirm receipt.',
    'staffMisc.tables.allOrdersServedReady':
      'All orders are served. The table can now finish the meal and pay.',
    'staffMisc.tables.paymentConfirmed': 'Payment has already been confirmed.',
    'staffMisc.tables.noTablesAssigned': 'No tables are assigned to you yet.',
    'staffMisc.tables.cash': 'Cash',
    'staffMisc.tables.card': 'Card',
    'staffMisc.tables.other': 'Other',
    'staffMisc.tables.changeDue': 'Change due',
    'staffMisc.tables.changeDueAmount': 'Give back {{amount}}',
    'staffMisc.tables.exactAmount': 'Exact amount, no change',
    'staffMisc.tables.tendered': 'Customer is paying with',
    'staffMisc.tables.splitBill': 'Split bill',
    'staffMisc.tables.perPersonChange': 'Change per person',
    'staffMisc.tables.owes': 'Owes',
    'staffMisc.tables.noChangeInfo': 'The customer did not say how much they will hand over.',

    // StaffPortalLogin.tsx
    'staffMisc.login.checkingAccess': 'Checking access...',
    'staffMisc.login.eyebrow': 'Restaurant staff access',
    'staffMisc.login.kitchenTitle': 'Kitchen',
    'staffMisc.login.waiterTitle': 'Waiter',
    'staffMisc.login.signInDesc':
      'Sign in with the account created by the restaurant manager.',
    'staffMisc.login.usernameEmail': 'Username / email',
    'staffMisc.login.emailPlaceholderKitchen': 'kitchen@restaurant.com',
    'staffMisc.login.emailPlaceholderWaiter': 'waiter@restaurant.com',
    'staffMisc.login.yourPasswordPlaceholder': 'Your password',
    'staffMisc.login.enterPortal': 'Enter {{portal}}',
    'staffMisc.login.couldNotSignIn': 'Could not sign in to {{portal}}.',

    // kitchen/[restaurantId]/page.tsx
    'staffMisc.kitchen.tableLabel': 'Table',
    'staffMisc.kitchen.justNow': 'Just now',
    'staffMisc.kitchen.oneMinAgo': '1 min ago',
    'staffMisc.kitchen.minutesAgo': '{{minutes}} min ago',
    'staffMisc.kitchen.orderNumber': 'Order #{{number}}',
    'staffMisc.kitchen.updating': 'Updating...',
    'staffMisc.kitchen.couldNotLoadAccess':
      'Could not load restaurant access',
    'staffMisc.kitchen.noStaffAccess':
      'You do not have staff access to this restaurant.',
    'staffMisc.kitchen.couldNotLoadOrders': 'Could not load orders',
    'staffMisc.kitchen.noAccess': 'You do not have access to this restaurant.',
    'staffMisc.kitchen.couldNotLoadKitchen': 'Could not load kitchen',
    'staffMisc.kitchen.couldNotUpdateOrder': 'Could not update order',
    'staffMisc.kitchen.title': 'Kitchen',
    'staffMisc.kitchen.unavailableTitle': 'Kitchen unavailable',
    'staffMisc.kitchen.live': 'Live',
    'staffMisc.kitchen.reconnecting': 'Reconnecting',
    'staffMisc.kitchen.newOrders': 'New orders',
    'staffMisc.kitchen.accepted': 'Accepted',
    'staffMisc.kitchen.preparing': 'Preparing',
    'staffMisc.kitchen.noNewOrders': 'No new orders.',
    'staffMisc.kitchen.noAcceptedOrders': 'No accepted orders.',
    'staffMisc.kitchen.nothingCooking': 'Nothing cooking right now.',
    'staffMisc.kitchen.acceptOrder': 'Accept order',
    'staffMisc.kitchen.markUnavailable': 'Unavailable',
    'staffMisc.kitchen.unavailableNotePlaceholder': 'Reason (optional)',
    'staffMisc.kitchen.confirmUnavailable': 'Confirm',
    'staffMisc.kitchen.itemUnavailable': 'Unavailable',
    'staffMisc.kitchen.startPreparing': 'Start preparing',
    'staffMisc.kitchen.markReady': 'Mark ready',
  },
  pt: {
    // select/page.tsx
    'staffMisc.select.eyebrow': 'Empregado de mesa',
    'staffMisc.select.unavailableTitle': 'Empregados de mesa indisponíveis',
    'staffMisc.select.couldNotLoadAccess':
      'Não foi possível carregar o acesso ao restaurante.',
    'staffMisc.select.couldNotLoadWaiters':
      'Não foi possível carregar os empregados de mesa.',
    'staffMisc.select.noAccess': 'Não tem acesso a este restaurante.',
    'staffMisc.select.chooseWaiter': 'Escolher empregado de mesa',
    'staffMisc.select.chooseWaiterDesc':
      'Selecione a sessão de empregado de mesa que pretende abrir.',
    'staffMisc.select.noWaiters': 'Nenhum empregado de mesa criado',
    'staffMisc.select.noWaitersDesc':
      'O gerente precisa de criar primeiro as contas de empregado de mesa.',
    'staffMisc.select.manageWaiters': 'Gerir empregados de mesa',
    'staffMisc.select.waiterNumber': 'Empregado de mesa {{number}}',
    'staffMisc.select.openSession': 'Abrir sessão →',

    // tables/page.tsx
    'staffMisc.tables.loadingTables': 'A carregar mesas...',
    'staffMisc.tables.couldNotLoadTables':
      'Não foi possível carregar as mesas',
    'staffMisc.tables.couldNotLoadAssignments':
      'Não foi possível carregar as atribuições',
    'staffMisc.tables.couldNotLoadStatus':
      'Não foi possível carregar o estado das mesas',
    'staffMisc.tables.couldNotAssignTable':
      'Não foi possível atribuir a mesa',
    'staffMisc.tables.couldNotRemoveAssignment':
      'Não foi possível remover a atribuição',
    'staffMisc.tables.liveFloorEyebrow': 'Sala em direto',
    'staffMisc.tables.myTables': 'As minhas mesas',
    'staffMisc.tables.myTablesDesc':
      'Veja as suas mesas atribuídas e saiba de imediato quando um cliente pede para pagar.',
    'staffMisc.tables.backToWaiter': 'Voltar ao empregado de mesa',
    'staffMisc.tables.assignedToMe': 'Atribuídas a mim',
    'staffMisc.tables.noneAssignedYet': 'Ainda não tem mesas atribuídas.',
    'staffMisc.tables.rolePrimary': 'PRINCIPAL',
    'staffMisc.tables.roleAssisting': 'APOIO',
    'staffMisc.tables.assignMyselfOption': 'Atribuir-me uma mesa...',
    'staffMisc.tables.assign': 'Atribuir',
    'staffMisc.tables.liveStatusEyebrow': 'Estado das mesas em direto',
    'staffMisc.tables.floorOverview': 'Vista geral da sala',
    'staffMisc.tables.currentBill': 'Conta atual',
    'staffMisc.tables.customerSelected': 'O cliente escolheu',
    'staffMisc.tables.paymentMethodMissing': 'Falta o método de pagamento',
    'staffMisc.tables.goToPaymentRequest':
      'Vá ao pedido de pagamento no painel do empregado de mesa e confirme a receção.',
    'staffMisc.tables.allOrdersServedReady':
      'Todos os pedidos foram servidos. A mesa já pode terminar a refeição e pagar.',
    'staffMisc.tables.paymentConfirmed': 'O pagamento já foi confirmado.',
    'staffMisc.tables.noTablesAssigned': 'Ainda não tem mesas atribuídas.',
    'staffMisc.tables.cash': 'Dinheiro',
    'staffMisc.tables.card': 'Cartão',
    'staffMisc.tables.other': 'Outro',
    'staffMisc.tables.changeDue': 'Troco a devolver',
    'staffMisc.tables.changeDueAmount': 'Devolver {{amount}}',
    'staffMisc.tables.exactAmount': 'Valor exato, sem troco',
    'staffMisc.tables.tendered': 'O cliente paga com',
    'staffMisc.tables.splitBill': 'Conta dividida',
    'staffMisc.tables.perPersonChange': 'Troco por pessoa',
    'staffMisc.tables.owes': 'Deve',
    'staffMisc.tables.noChangeInfo': 'O cliente não indicou com quanto vai pagar.',

    // StaffPortalLogin.tsx
    'staffMisc.login.checkingAccess': 'A verificar o acesso...',
    'staffMisc.login.eyebrow': 'Acesso da equipa do restaurante',
    'staffMisc.login.kitchenTitle': 'Cozinha',
    'staffMisc.login.waiterTitle': 'Empregado de mesa',
    'staffMisc.login.signInDesc':
      'Inicie sessão com a conta criada pelo gerente do restaurante.',
    'staffMisc.login.usernameEmail': 'Utilizador / email',
    'staffMisc.login.emailPlaceholderKitchen': 'cozinha@restaurante.com',
    'staffMisc.login.emailPlaceholderWaiter': 'empregado@restaurante.com',
    'staffMisc.login.yourPasswordPlaceholder': 'A sua palavra-passe',
    'staffMisc.login.enterPortal': 'Entrar em {{portal}}',
    'staffMisc.login.couldNotSignIn':
      'Não foi possível iniciar sessão em {{portal}}.',

    // kitchen/[restaurantId]/page.tsx
    'staffMisc.kitchen.tableLabel': 'Mesa',
    'staffMisc.kitchen.justNow': 'Agora mesmo',
    'staffMisc.kitchen.oneMinAgo': 'Há 1 min',
    'staffMisc.kitchen.minutesAgo': 'Há {{minutes}} min',
    'staffMisc.kitchen.orderNumber': 'Pedido n.º {{number}}',
    'staffMisc.kitchen.updating': 'A atualizar...',
    'staffMisc.kitchen.couldNotLoadAccess':
      'Não foi possível carregar o acesso ao restaurante',
    'staffMisc.kitchen.noStaffAccess':
      'Não tem acesso de equipa a este restaurante.',
    'staffMisc.kitchen.couldNotLoadOrders':
      'Não foi possível carregar os pedidos',
    'staffMisc.kitchen.noAccess': 'Não tem acesso a este restaurante.',
    'staffMisc.kitchen.couldNotLoadKitchen':
      'Não foi possível carregar a cozinha',
    'staffMisc.kitchen.couldNotUpdateOrder':
      'Não foi possível atualizar o pedido',
    'staffMisc.kitchen.title': 'Cozinha',
    'staffMisc.kitchen.unavailableTitle': 'Cozinha indisponível',
    'staffMisc.kitchen.live': 'Em direto',
    'staffMisc.kitchen.reconnecting': 'A reconectar',
    'staffMisc.kitchen.newOrders': 'Pedidos novos',
    'staffMisc.kitchen.accepted': 'Aceites',
    'staffMisc.kitchen.preparing': 'Em preparação',
    'staffMisc.kitchen.noNewOrders': 'Não há pedidos novos.',
    'staffMisc.kitchen.noAcceptedOrders': 'Não há pedidos aceites.',
    'staffMisc.kitchen.nothingCooking':
      'Não há nada em preparação neste momento.',
    'staffMisc.kitchen.acceptOrder': 'Aceitar pedido',
    'staffMisc.kitchen.markUnavailable': 'Indisponível',
    'staffMisc.kitchen.unavailableNotePlaceholder': 'Motivo (opcional)',
    'staffMisc.kitchen.confirmUnavailable': 'Confirmar',
    'staffMisc.kitchen.itemUnavailable': 'Indisponível',
    'staffMisc.kitchen.startPreparing': 'Começar a preparar',
    'staffMisc.kitchen.markReady': 'Marcar como pronto',
  },
  de: {
    // select/page.tsx
    'staffMisc.select.eyebrow': 'Kellner',
    'staffMisc.select.unavailableTitle': 'Kellner nicht verfügbar',
    'staffMisc.select.couldNotLoadAccess':
      'Der Restaurantzugriff konnte nicht geladen werden.',
    'staffMisc.select.couldNotLoadWaiters':
      'Die Kellner konnten nicht geladen werden.',
    'staffMisc.select.noAccess':
      'Sie haben keinen Zugriff auf dieses Restaurant.',
    'staffMisc.select.chooseWaiter': 'Kellner auswählen',
    'staffMisc.select.chooseWaiterDesc':
      'Wählen Sie die Kellner-Sitzung aus, die Sie öffnen möchten.',
    'staffMisc.select.noWaiters': 'Keine Kellner angelegt',
    'staffMisc.select.noWaitersDesc':
      'Der Manager muss zuerst Kellnerkonten anlegen.',
    'staffMisc.select.manageWaiters': 'Kellner verwalten',
    'staffMisc.select.waiterNumber': 'Kellner {{number}}',
    'staffMisc.select.openSession': 'Sitzung öffnen →',

    // tables/page.tsx
    'staffMisc.tables.loadingTables': 'Tische werden geladen...',
    'staffMisc.tables.couldNotLoadTables':
      'Die Tische konnten nicht geladen werden',
    'staffMisc.tables.couldNotLoadAssignments':
      'Die Zuweisungen konnten nicht geladen werden',
    'staffMisc.tables.couldNotLoadStatus':
      'Der Tischstatus konnte nicht geladen werden',
    'staffMisc.tables.couldNotAssignTable':
      'Der Tisch konnte nicht zugewiesen werden',
    'staffMisc.tables.couldNotRemoveAssignment':
      'Die Zuweisung konnte nicht entfernt werden',
    'staffMisc.tables.liveFloorEyebrow': 'Live-Übersicht',
    'staffMisc.tables.myTables': 'Meine Tische',
    'staffMisc.tables.myTablesDesc':
      'Sehen Sie Ihre zugewiesenen Tische und erfahren Sie sofort, wenn ein Gast um die Rechnung bittet.',
    'staffMisc.tables.backToWaiter': 'Zurück zum Kellner',
    'staffMisc.tables.assignedToMe': 'Mir zugewiesen',
    'staffMisc.tables.noneAssignedYet': 'Ihnen sind noch keine Tische zugewiesen.',
    'staffMisc.tables.rolePrimary': 'HAUPT',
    'staffMisc.tables.roleAssisting': 'UNTERSTÜTZUNG',
    'staffMisc.tables.assignMyselfOption': 'Mir einen Tisch zuweisen...',
    'staffMisc.tables.assign': 'Zuweisen',
    'staffMisc.tables.liveStatusEyebrow': 'Tischstatus live',
    'staffMisc.tables.floorOverview': 'Saalübersicht',
    'staffMisc.tables.currentBill': 'Aktuelle Rechnung',
    'staffMisc.tables.customerSelected': 'Gast hat gewählt',
    'staffMisc.tables.paymentMethodMissing': 'Zahlungsmethode fehlt',
    'staffMisc.tables.goToPaymentRequest':
      'Öffnen Sie die Zahlungsanfrage im Kellner-Bereich und bestätigen Sie den Erhalt.',
    'staffMisc.tables.allOrdersServedReady':
      'Alle Bestellungen wurden serviert. Der Tisch kann die Mahlzeit jetzt abschließen und bezahlen.',
    'staffMisc.tables.paymentConfirmed': 'Die Zahlung wurde bereits bestätigt.',
    'staffMisc.tables.noTablesAssigned':
      'Ihnen sind noch keine Tische zugewiesen.',
    'staffMisc.tables.cash': 'Bar',
    'staffMisc.tables.card': 'Karte',
    'staffMisc.tables.other': 'Sonstiges',
    'staffMisc.tables.changeDue': 'Rückgeld',
    'staffMisc.tables.changeDueAmount': '{{amount}} zurückgeben',
    'staffMisc.tables.exactAmount': 'Passend gezahlt, kein Wechselgeld',
    'staffMisc.tables.tendered': 'Kunde zahlt mit',
    'staffMisc.tables.splitBill': 'Geteilte Rechnung',
    'staffMisc.tables.perPersonChange': 'Wechselgeld pro Person',
    'staffMisc.tables.owes': 'Schuldet',
    'staffMisc.tables.noChangeInfo': 'Der Gast hat nicht angegeben, mit wie viel er zahlt.',

    // StaffPortalLogin.tsx
    'staffMisc.login.checkingAccess': 'Zugriff wird geprüft...',
    'staffMisc.login.eyebrow': 'Zugang für Restaurantpersonal',
    'staffMisc.login.kitchenTitle': 'Küche',
    'staffMisc.login.waiterTitle': 'Kellner',
    'staffMisc.login.signInDesc':
      'Melden Sie sich mit dem vom Restaurantmanager erstellten Konto an.',
    'staffMisc.login.usernameEmail': 'Benutzername / E-Mail',
    'staffMisc.login.emailPlaceholderKitchen': 'kueche@restaurant.com',
    'staffMisc.login.emailPlaceholderWaiter': 'kellner@restaurant.com',
    'staffMisc.login.yourPasswordPlaceholder': 'Ihr Passwort',
    'staffMisc.login.enterPortal': '{{portal}} betreten',
    'staffMisc.login.couldNotSignIn': 'Anmeldung bei {{portal}} nicht möglich.',

    // kitchen/[restaurantId]/page.tsx
    'staffMisc.kitchen.tableLabel': 'Tisch',
    'staffMisc.kitchen.justNow': 'Gerade eben',
    'staffMisc.kitchen.oneMinAgo': 'Vor 1 Min.',
    'staffMisc.kitchen.minutesAgo': 'Vor {{minutes}} Min.',
    'staffMisc.kitchen.orderNumber': 'Bestellung Nr. {{number}}',
    'staffMisc.kitchen.updating': 'Wird aktualisiert...',
    'staffMisc.kitchen.couldNotLoadAccess':
      'Der Restaurantzugriff konnte nicht geladen werden',
    'staffMisc.kitchen.noStaffAccess':
      'Sie haben keinen Personalzugriff auf dieses Restaurant.',
    'staffMisc.kitchen.couldNotLoadOrders':
      'Die Bestellungen konnten nicht geladen werden',
    'staffMisc.kitchen.noAccess':
      'Sie haben keinen Zugriff auf dieses Restaurant.',
    'staffMisc.kitchen.couldNotLoadKitchen':
      'Die Küche konnte nicht geladen werden',
    'staffMisc.kitchen.couldNotUpdateOrder':
      'Die Bestellung konnte nicht aktualisiert werden',
    'staffMisc.kitchen.title': 'Küche',
    'staffMisc.kitchen.unavailableTitle': 'Küche nicht verfügbar',
    'staffMisc.kitchen.live': 'Live',
    'staffMisc.kitchen.reconnecting': 'Verbindung wird wiederhergestellt',
    'staffMisc.kitchen.newOrders': 'Neue Bestellungen',
    'staffMisc.kitchen.accepted': 'Angenommen',
    'staffMisc.kitchen.preparing': 'In Zubereitung',
    'staffMisc.kitchen.noNewOrders': 'Keine neuen Bestellungen.',
    'staffMisc.kitchen.noAcceptedOrders': 'Keine angenommenen Bestellungen.',
    'staffMisc.kitchen.nothingCooking': 'Gerade wird nichts zubereitet.',
    'staffMisc.kitchen.acceptOrder': 'Bestellung annehmen',
    'staffMisc.kitchen.markUnavailable': 'Nicht verfügbar',
    'staffMisc.kitchen.unavailableNotePlaceholder': 'Grund (optional)',
    'staffMisc.kitchen.confirmUnavailable': 'Bestätigen',
    'staffMisc.kitchen.itemUnavailable': 'Nicht verfügbar',
    'staffMisc.kitchen.startPreparing': 'Zubereitung starten',
    'staffMisc.kitchen.markReady': 'Als fertig markieren',
  },
  fr: {
    // select/page.tsx
    'staffMisc.select.eyebrow': 'Serveur',
    'staffMisc.select.unavailableTitle': 'Serveurs indisponibles',
    'staffMisc.select.couldNotLoadAccess':
      "Impossible de charger l'accès au restaurant.",
    'staffMisc.select.couldNotLoadWaiters':
      'Impossible de charger les serveurs.',
    'staffMisc.select.noAccess': "Vous n'avez pas accès à ce restaurant.",
    'staffMisc.select.chooseWaiter': 'Choisir un serveur',
    'staffMisc.select.chooseWaiterDesc':
      'Sélectionnez la session de serveur que vous souhaitez ouvrir.',
    'staffMisc.select.noWaiters': 'Aucun serveur créé',
    'staffMisc.select.noWaitersDesc':
      "Le responsable doit d'abord créer des comptes de serveur.",
    'staffMisc.select.manageWaiters': 'Gérer les serveurs',
    'staffMisc.select.waiterNumber': 'Serveur {{number}}',
    'staffMisc.select.openSession': 'Ouvrir la session →',

    // tables/page.tsx
    'staffMisc.tables.loadingTables': 'Chargement des tables...',
    'staffMisc.tables.couldNotLoadTables':
      'Impossible de charger les tables',
    'staffMisc.tables.couldNotLoadAssignments':
      'Impossible de charger les attributions',
    'staffMisc.tables.couldNotLoadStatus':
      "Impossible de charger l'état des tables",
    'staffMisc.tables.couldNotAssignTable':
      "Impossible d'attribuer la table",
    'staffMisc.tables.couldNotRemoveAssignment':
      "Impossible de retirer l'attribution",
    'staffMisc.tables.liveFloorEyebrow': 'Salle en direct',
    'staffMisc.tables.myTables': 'Mes tables',
    'staffMisc.tables.myTablesDesc':
      'Consultez vos tables attribuées et sachez immédiatement quand un client demande à payer.',
    'staffMisc.tables.backToWaiter': 'Retour au serveur',
    'staffMisc.tables.assignedToMe': 'Attribuées à moi',
    'staffMisc.tables.noneAssignedYet':
      "Vous n'avez encore aucune table attribuée.",
    'staffMisc.tables.rolePrimary': 'PRINCIPAL',
    'staffMisc.tables.roleAssisting': 'RENFORT',
    'staffMisc.tables.assignMyselfOption': "M'attribuer une table...",
    'staffMisc.tables.assign': 'Attribuer',
    'staffMisc.tables.liveStatusEyebrow': 'État des tables en direct',
    'staffMisc.tables.floorOverview': "Vue d'ensemble de la salle",
    'staffMisc.tables.currentBill': 'Addition actuelle',
    'staffMisc.tables.customerSelected': 'Le client a choisi',
    'staffMisc.tables.paymentMethodMissing': 'Mode de paiement manquant',
    'staffMisc.tables.goToPaymentRequest':
      'Rendez-vous sur la demande de paiement dans le tableau de bord serveur et confirmez la réception.',
    'staffMisc.tables.allOrdersServedReady':
      'Toutes les commandes sont servies. La table peut maintenant terminer le repas et payer.',
    'staffMisc.tables.paymentConfirmed': 'Le paiement a déjà été confirmé.',
    'staffMisc.tables.noTablesAssigned':
      "Vous n'avez encore aucune table attribuée.",
    'staffMisc.tables.cash': 'Espèces',
    'staffMisc.tables.card': 'Carte',
    'staffMisc.tables.other': 'Autre',
    'staffMisc.tables.changeDue': 'Monnaie à rendre',
    'staffMisc.tables.changeDueAmount': 'Rendre {{amount}}',
    'staffMisc.tables.exactAmount': 'Montant exact, pas de monnaie',
    'staffMisc.tables.tendered': 'Le client paie avec',
    'staffMisc.tables.splitBill': 'Addition partagée',
    'staffMisc.tables.perPersonChange': 'Monnaie par personne',
    'staffMisc.tables.owes': 'Doit',
    'staffMisc.tables.noChangeInfo': "Le client n'a pas indiqué avec quel montant il paie.",

    // StaffPortalLogin.tsx
    'staffMisc.login.checkingAccess': "Vérification de l'accès...",
    'staffMisc.login.eyebrow': 'Accès du personnel du restaurant',
    'staffMisc.login.kitchenTitle': 'Cuisine',
    'staffMisc.login.waiterTitle': 'Serveur',
    'staffMisc.login.signInDesc':
      'Connectez-vous avec le compte créé par le responsable du restaurant.',
    'staffMisc.login.usernameEmail': 'Identifiant / e-mail',
    'staffMisc.login.emailPlaceholderKitchen': 'cuisine@restaurant.com',
    'staffMisc.login.emailPlaceholderWaiter': 'serveur@restaurant.com',
    'staffMisc.login.yourPasswordPlaceholder': 'Votre mot de passe',
    'staffMisc.login.enterPortal': 'Entrer dans {{portal}}',
    'staffMisc.login.couldNotSignIn': 'Connexion à {{portal}} impossible.',

    // kitchen/[restaurantId]/page.tsx
    'staffMisc.kitchen.tableLabel': 'Table',
    'staffMisc.kitchen.justNow': "À l'instant",
    'staffMisc.kitchen.oneMinAgo': 'Il y a 1 min',
    'staffMisc.kitchen.minutesAgo': 'Il y a {{minutes}} min',
    'staffMisc.kitchen.orderNumber': 'Commande n° {{number}}',
    'staffMisc.kitchen.updating': 'Mise à jour...',
    'staffMisc.kitchen.couldNotLoadAccess':
      "Impossible de charger l'accès au restaurant",
    'staffMisc.kitchen.noStaffAccess':
      "Vous n'avez pas d'accès personnel à ce restaurant.",
    'staffMisc.kitchen.couldNotLoadOrders':
      'Impossible de charger les commandes',
    'staffMisc.kitchen.noAccess': "Vous n'avez pas accès à ce restaurant.",
    'staffMisc.kitchen.couldNotLoadKitchen':
      'Impossible de charger la cuisine',
    'staffMisc.kitchen.couldNotUpdateOrder':
      'Impossible de mettre à jour la commande',
    'staffMisc.kitchen.title': 'Cuisine',
    'staffMisc.kitchen.unavailableTitle': 'Cuisine indisponible',
    'staffMisc.kitchen.live': 'En direct',
    'staffMisc.kitchen.reconnecting': 'Reconnexion',
    'staffMisc.kitchen.newOrders': 'Nouvelles commandes',
    'staffMisc.kitchen.accepted': 'Acceptées',
    'staffMisc.kitchen.preparing': 'En préparation',
    'staffMisc.kitchen.noNewOrders': 'Aucune nouvelle commande.',
    'staffMisc.kitchen.noAcceptedOrders': 'Aucune commande acceptée.',
    'staffMisc.kitchen.nothingCooking': 'Rien en préparation pour le moment.',
    'staffMisc.kitchen.acceptOrder': 'Accepter la commande',
    'staffMisc.kitchen.markUnavailable': 'Indisponible',
    'staffMisc.kitchen.unavailableNotePlaceholder': 'Motif (facultatif)',
    'staffMisc.kitchen.confirmUnavailable': 'Confirmer',
    'staffMisc.kitchen.itemUnavailable': 'Indisponible',
    'staffMisc.kitchen.startPreparing': 'Commencer la préparation',
    'staffMisc.kitchen.markReady': 'Marquer comme prête',
  },
};
