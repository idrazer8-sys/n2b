import type { Locale } from '../locales';

/**
 * Orders board + Waiters management:
 * app/dashboard/[restaurantId]/orders/page.tsx,
 * app/dashboard/[restaurantId]/waiters/page.tsx,
 * app/dashboard/[restaurantId]/waiters/new/page.tsx.
 */
export const ordersWaiters: Record<Locale, Record<string, string>> = {
  es: {
    // orders/page.tsx
    'ordersWaiters.orders.readyNoticeTitle': 'Pedido listo',
    'ordersWaiters.orders.readyNoticeBody':
      'El pedido #{{number}} está listo para recoger.',
    'ordersWaiters.orders.dismiss': 'Descartar',
    'ordersWaiters.orders.eyebrow': 'Servicio',
    'ordersWaiters.orders.title': 'Listos para recoger',
    'ordersWaiters.orders.countSingular': '{{count}} pedido',
    'ordersWaiters.orders.countPlural': '{{count}} pedidos',
    'ordersWaiters.orders.emptyTitle': 'Todo al día',
    'ordersWaiters.orders.emptyBody':
      'La cocina te avisará cuando un pedido esté listo.',
    'ordersWaiters.orders.tablePrefix': 'Mesa {{label}}',
    'ordersWaiters.orders.orderNumber': 'Pedido #{{number}}',
    'ordersWaiters.orders.statusReady': 'LISTO',
    'ordersWaiters.orders.markServed': 'Marcar servido',

    // waiters/new/page.tsx
    'ordersWaiters.newWaiter.couldNotCreate':
      'No se pudo crear la cuenta del camarero',
    'ordersWaiters.newWaiter.eyebrow': 'Gestión de personal',
    'ordersWaiters.newWaiter.title': 'Añadir camarero',
    'ordersWaiters.newWaiter.description':
      'Crea el usuario/correo y la contraseña que el camarero usará para acceder a Cocina y Sala.',
    'ordersWaiters.newWaiter.fullNameLabel': 'Nombre completo',
    'ordersWaiters.newWaiter.fullNamePlaceholder': 'Maria García',
    'ordersWaiters.newWaiter.usernameEmailLabel': 'Usuario / correo electrónico',
    'ordersWaiters.newWaiter.emailPlaceholder': 'maria@restaurante.com',
    'ordersWaiters.newWaiter.tempPasswordLabel': 'Contraseña temporal',
    'ordersWaiters.newWaiter.passwordPlaceholder': 'Al menos 10 caracteres',
    'ordersWaiters.newWaiter.passwordHint':
      'Entrega esta contraseña al camarero de forma segura.',
    'ordersWaiters.newWaiter.creating': 'Creando...',
    'ordersWaiters.newWaiter.submit': 'Crear cuenta de camarero',

    // waiters/page.tsx
    'ordersWaiters.staff.couldNotLoadStaff': 'No se pudo cargar el personal',
    'ordersWaiters.staff.couldNotLoadTables': 'No se pudieron cargar las mesas',
    'ordersWaiters.staff.couldNotLoadAssignments':
      'No se pudieron cargar las asignaciones de mesas',
    'ordersWaiters.staff.couldNotCreateStaff':
      'No se pudo crear la cuenta de personal',
    'ordersWaiters.staff.couldNotArchive': 'No se pudo archivar la cuenta',
    'ordersWaiters.staff.couldNotPermanentlyDelete':
      'No se pudo eliminar la cuenta de forma permanente',
    'ordersWaiters.staff.onlyWaitersAssignable':
      'Solo las cuentas de camarero pueden asignarse a mesas.',
    'ordersWaiters.staff.couldNotAssignTable': 'No se pudo asignar la mesa',
    'ordersWaiters.staff.couldNotAssignSelf': 'No te pudiste asignar',
    'ordersWaiters.staff.couldNotRemoveAssignment':
      'No se pudo quitar la asignación',
    'ordersWaiters.staff.confirmArchive':
      '¿Archivar esta cuenta? Perderá el acceso de inmediato, pero seguirá disponible en el Historial de personal.',
    'ordersWaiters.staff.confirmPermanentDelete':
      '¿Eliminar esta cuenta de forma permanente? La cuenta y su historial se eliminarán. Esta acción no se puede deshacer.',
    'ordersWaiters.staff.archiving': 'Archivando...',
    'ordersWaiters.staff.deleteAccount': 'Eliminar cuenta',
    'ordersWaiters.staff.loadingStaff': 'Cargando personal...',
    'ordersWaiters.staff.eyebrow': 'Personal del restaurante',
    'ordersWaiters.staff.pageTitle': 'Personal',
    'ordersWaiters.staff.pageDescription':
      'Crea cuentas de personal, elige su portal, asigna camareros a mesas y gestiona el historial de cuentas.',
    'ordersWaiters.staff.statsLine':
      '{{waiters}} camareros · {{kitchen}} cocina · {{assigned}} mesas asignadas · En vivo',
    'ordersWaiters.staff.addStaffEyebrow': 'Añadir personal',
    'ordersWaiters.staff.addStaffDescription':
      'El encargado elige si esta cuenta es de camarero o de cocina.',
    'ordersWaiters.staff.roleWaiter': 'Camarero',
    'ordersWaiters.staff.roleKitchen': 'Cocina',
    'ordersWaiters.staff.fullNamePlaceholder': 'Nombre completo',
    'ordersWaiters.staff.passwordPlaceholder': 'Contraseña (10+ caracteres)',
    'ordersWaiters.staff.creatingAccount': 'Creando...',
    'ordersWaiters.staff.createAccountButton': 'Crear cuenta de {{role}}',
    'ordersWaiters.staff.selfAssignEyebrow': 'Autoasignación del encargado',
    'ordersWaiters.staff.selfAssignDescription':
      'El encargado también puede hacerse responsable de una mesa directamente.',
    'ordersWaiters.staff.allTablesAssigned':
      'Todas las mesas activas ya tienen una asignación principal.',
    'ordersWaiters.staff.assigningEllipsis': 'Asignando...',
    'ordersWaiters.staff.assignMyself': 'Asignarme · {{label}}',
    'ordersWaiters.staff.serviceStaffEyebrow': 'Personal de sala',
    'ordersWaiters.staff.waitersHeading': 'Camareros',
    'ordersWaiters.staff.waitersDescription':
      'Solo las cuentas de camarero activas pueden asignarse a mesas.',
    'ordersWaiters.staff.noActiveWaiters': 'Sin camareros activos',
    'ordersWaiters.staff.createWaiterAbove': 'Crea una cuenta de camarero arriba.',
    'ordersWaiters.staff.assignedTablesLabel': 'Mesas asignadas',
    'ordersWaiters.staff.noTablesAssigned': 'Sin mesas asignadas.',
    'ordersWaiters.staff.rolePrimary': 'Principal',
    'ordersWaiters.staff.roleAssisting': 'Auxiliar',
    'ordersWaiters.staff.selectTablePlaceholder': 'Selecciona una mesa',
    'ordersWaiters.staff.assignTableButton': 'Asignar mesa',
    'ordersWaiters.staff.operationsEyebrow': 'Operaciones',
    'ordersWaiters.staff.kitchenStaffHeading': 'Personal de cocina',
    'ordersWaiters.staff.kitchenStaffDescription':
      'Las cuentas de cocina pueden acceder al portal de Cocina y no pueden asignarse a mesas.',
    'ordersWaiters.staff.noActiveKitchen': 'Sin cuentas de cocina activas',
    'ordersWaiters.staff.createKitchenAbove': 'Crea una cuenta de cocina arriba.',
    'ordersWaiters.staff.portalLabel': 'Portal',
    'ordersWaiters.staff.historyEyebrow': 'Historial',
    'ordersWaiters.staff.archivedStaffHeading': 'Personal archivado',
    'ordersWaiters.staff.archivedStaffDescription':
      'Las cuentas archivadas permanecen aquí hasta que se eliminen de forma permanente.',
    'ordersWaiters.staff.noArchivedStaff': 'No hay personal archivado.',
    'ordersWaiters.staff.archivedBadge': 'Archivado',
    'ordersWaiters.staff.portalInlineLabel': 'Portal:',
    'ordersWaiters.staff.archivedDateLabel': 'Archivado:',
    'ordersWaiters.staff.unknownDate': 'Desconocido',
    'ordersWaiters.staff.deletingPermanently': 'Eliminando de forma permanente...',
    'ordersWaiters.staff.deletePermanently': 'Eliminar permanentemente',
    'ordersWaiters.staff.permanentDeleteNote':
      'Esta acción elimina la cuenta de forma permanente.',
    'ordersWaiters.staff.operationsFooterHeading': 'Operaciones de personal',
    'ordersWaiters.staff.opNote1':
      'Los encargados crean cuentas de camarero y de cocina desde esta página.',
    'ordersWaiters.staff.opNote2':
      'Eliminar una cuenta activa primero la archiva y desactiva su acceso.',
    'ordersWaiters.staff.opNote3':
      'Las cuentas archivadas siguen disponibles en el Historial de personal.',
    'ordersWaiters.staff.opNote4':
      'La eliminación permanente es un segundo paso independiente.',
    'ordersWaiters.staff.opNote5':
      'Los camareros pueden asignarse a mesas. Las cuentas de cocina no.',
  },
  en: {
    // orders/page.tsx
    'ordersWaiters.orders.readyNoticeTitle': 'Order ready',
    'ordersWaiters.orders.readyNoticeBody':
      'Order #{{number}} is ready for pickup.',
    'ordersWaiters.orders.dismiss': 'Dismiss',
    'ordersWaiters.orders.eyebrow': 'Service',
    'ordersWaiters.orders.title': 'Ready for pickup',
    'ordersWaiters.orders.countSingular': '{{count}} order',
    'ordersWaiters.orders.countPlural': '{{count}} orders',
    'ordersWaiters.orders.emptyTitle': 'All caught up',
    'ordersWaiters.orders.emptyBody':
      'The kitchen will notify you when an order is ready.',
    'ordersWaiters.orders.tablePrefix': 'Table {{label}}',
    'ordersWaiters.orders.orderNumber': 'Order #{{number}}',
    'ordersWaiters.orders.statusReady': 'READY',
    'ordersWaiters.orders.markServed': 'Mark served',

    // waiters/new/page.tsx
    'ordersWaiters.newWaiter.couldNotCreate':
      'Could not create waiter account',
    'ordersWaiters.newWaiter.eyebrow': 'Staff management',
    'ordersWaiters.newWaiter.title': 'Add waiter',
    'ordersWaiters.newWaiter.description':
      'Create the username/email and password the waiter will use for Kitchen and Waiter access.',
    'ordersWaiters.newWaiter.fullNameLabel': 'Full name',
    'ordersWaiters.newWaiter.fullNamePlaceholder': 'Maria Garcia',
    'ordersWaiters.newWaiter.usernameEmailLabel': 'Username / email',
    'ordersWaiters.newWaiter.emailPlaceholder': 'maria@restaurant.com',
    'ordersWaiters.newWaiter.tempPasswordLabel': 'Temporary password',
    'ordersWaiters.newWaiter.passwordPlaceholder': 'At least 10 characters',
    'ordersWaiters.newWaiter.passwordHint':
      'Give this password to the waiter securely.',
    'ordersWaiters.newWaiter.creating': 'Creating...',
    'ordersWaiters.newWaiter.submit': 'Create waiter account',

    // waiters/page.tsx
    'ordersWaiters.staff.couldNotLoadStaff': 'Could not load staff',
    'ordersWaiters.staff.couldNotLoadTables': 'Could not load tables',
    'ordersWaiters.staff.couldNotLoadAssignments':
      'Could not load table assignments',
    'ordersWaiters.staff.couldNotCreateStaff':
      'Could not create staff account',
    'ordersWaiters.staff.couldNotArchive': 'Could not archive account',
    'ordersWaiters.staff.couldNotPermanentlyDelete':
      'Could not permanently delete account',
    'ordersWaiters.staff.onlyWaitersAssignable':
      'Only waiter accounts can be assigned to tables.',
    'ordersWaiters.staff.couldNotAssignTable': 'Could not assign table',
    'ordersWaiters.staff.couldNotAssignSelf': 'Could not assign yourself',
    'ordersWaiters.staff.couldNotRemoveAssignment':
      'Could not remove assignment',
    'ordersWaiters.staff.confirmArchive':
      'Archive this account? It will immediately lose access but remain available in Staff History.',
    'ordersWaiters.staff.confirmPermanentDelete':
      'Permanently delete this account? The account and its staff history will be removed. This cannot be undone.',
    'ordersWaiters.staff.archiving': 'Archiving...',
    'ordersWaiters.staff.deleteAccount': 'Delete account',
    'ordersWaiters.staff.loadingStaff': 'Loading staff...',
    'ordersWaiters.staff.eyebrow': 'Restaurant staff',
    'ordersWaiters.staff.pageTitle': 'Staff',
    'ordersWaiters.staff.pageDescription':
      'Create staff accounts, choose their portal, assign Waiters to tables and manage account history.',
    'ordersWaiters.staff.statsLine':
      '{{waiters}} waiters · {{kitchen}} kitchen · {{assigned}} assigned tables · Live',
    'ordersWaiters.staff.addStaffEyebrow': 'Add staff',
    'ordersWaiters.staff.addStaffDescription':
      'The Manager chooses whether this account is a Waiter or Kitchen account.',
    'ordersWaiters.staff.roleWaiter': 'Waiter',
    'ordersWaiters.staff.roleKitchen': 'Kitchen',
    'ordersWaiters.staff.fullNamePlaceholder': 'Full name',
    'ordersWaiters.staff.passwordPlaceholder': 'Password (10+ characters)',
    'ordersWaiters.staff.creatingAccount': 'Creating...',
    'ordersWaiters.staff.createAccountButton': 'Create {{role}} account',
    'ordersWaiters.staff.selfAssignEyebrow': 'Manager self-assignment',
    'ordersWaiters.staff.selfAssignDescription':
      'The manager can also take responsibility for a table directly.',
    'ordersWaiters.staff.allTablesAssigned':
      'Every active table already has a primary assignment.',
    'ordersWaiters.staff.assigningEllipsis': 'Assigning...',
    'ordersWaiters.staff.assignMyself': 'Assign myself · {{label}}',
    'ordersWaiters.staff.serviceStaffEyebrow': 'Service staff',
    'ordersWaiters.staff.waitersHeading': 'Waiters',
    'ordersWaiters.staff.waitersDescription':
      'Only active Waiter accounts can be assigned tables.',
    'ordersWaiters.staff.noActiveWaiters': 'No active waiters',
    'ordersWaiters.staff.createWaiterAbove': 'Create a Waiter account above.',
    'ordersWaiters.staff.assignedTablesLabel': 'Assigned tables',
    'ordersWaiters.staff.noTablesAssigned': 'No tables assigned.',
    'ordersWaiters.staff.rolePrimary': 'Primary',
    'ordersWaiters.staff.roleAssisting': 'Assisting',
    'ordersWaiters.staff.selectTablePlaceholder': 'Select a table',
    'ordersWaiters.staff.assignTableButton': 'Assign table',
    'ordersWaiters.staff.operationsEyebrow': 'Operations',
    'ordersWaiters.staff.kitchenStaffHeading': 'Kitchen staff',
    'ordersWaiters.staff.kitchenStaffDescription':
      'Kitchen accounts can access the Kitchen portal and cannot be assigned tables.',
    'ordersWaiters.staff.noActiveKitchen': 'No active kitchen accounts',
    'ordersWaiters.staff.createKitchenAbove': 'Create a Kitchen account above.',
    'ordersWaiters.staff.portalLabel': 'Portal',
    'ordersWaiters.staff.historyEyebrow': 'History',
    'ordersWaiters.staff.archivedStaffHeading': 'Archived staff',
    'ordersWaiters.staff.archivedStaffDescription':
      'Archived accounts remain stored here until permanently deleted.',
    'ordersWaiters.staff.noArchivedStaff': 'No archived staff accounts.',
    'ordersWaiters.staff.archivedBadge': 'Archived',
    'ordersWaiters.staff.portalInlineLabel': 'Portal:',
    'ordersWaiters.staff.archivedDateLabel': 'Archived:',
    'ordersWaiters.staff.unknownDate': 'Unknown',
    'ordersWaiters.staff.deletingPermanently': 'Deleting permanently...',
    'ordersWaiters.staff.deletePermanently': 'Delete permanently',
    'ordersWaiters.staff.permanentDeleteNote':
      'This action permanently removes the account.',
    'ordersWaiters.staff.operationsFooterHeading': 'Staff operations',
    'ordersWaiters.staff.opNote1':
      'Managers create Waiter and Kitchen accounts from this page.',
    'ordersWaiters.staff.opNote2':
      'Deleting an active account first archives it and disables access.',
    'ordersWaiters.staff.opNote3':
      'Archived accounts remain available in Staff History.',
    'ordersWaiters.staff.opNote4':
      'Permanent deletion is a separate second step.',
    'ordersWaiters.staff.opNote5':
      'Waiters can be assigned to tables. Kitchen accounts cannot.',
  },
  pt: {
    // orders/page.tsx
    'ordersWaiters.orders.readyNoticeTitle': 'Pedido pronto',
    'ordersWaiters.orders.readyNoticeBody':
      'O pedido #{{number}} está pronto para levantamento.',
    'ordersWaiters.orders.dismiss': 'Dispensar',
    'ordersWaiters.orders.eyebrow': 'Serviço',
    'ordersWaiters.orders.title': 'Prontos para levantar',
    'ordersWaiters.orders.countSingular': '{{count}} pedido',
    'ordersWaiters.orders.countPlural': '{{count}} pedidos',
    'ordersWaiters.orders.emptyTitle': 'Tudo em dia',
    'ordersWaiters.orders.emptyBody':
      'A cozinha irá avisar quando um pedido estiver pronto.',
    'ordersWaiters.orders.tablePrefix': 'Mesa {{label}}',
    'ordersWaiters.orders.orderNumber': 'Pedido #{{number}}',
    'ordersWaiters.orders.statusReady': 'PRONTO',
    'ordersWaiters.orders.markServed': 'Marcar como servido',

    // waiters/new/page.tsx
    'ordersWaiters.newWaiter.couldNotCreate':
      'Não foi possível criar a conta do empregado',
    'ordersWaiters.newWaiter.eyebrow': 'Gestão de equipa',
    'ordersWaiters.newWaiter.title': 'Adicionar empregado',
    'ordersWaiters.newWaiter.description':
      'Crie o nome de utilizador/email e a palavra-passe que o empregado usará para aceder à Cozinha e Sala.',
    'ordersWaiters.newWaiter.fullNameLabel': 'Nome completo',
    'ordersWaiters.newWaiter.fullNamePlaceholder': 'Maria Garcia',
    'ordersWaiters.newWaiter.usernameEmailLabel': 'Nome de utilizador / email',
    'ordersWaiters.newWaiter.emailPlaceholder': 'maria@restaurante.com',
    'ordersWaiters.newWaiter.tempPasswordLabel': 'Palavra-passe temporária',
    'ordersWaiters.newWaiter.passwordPlaceholder': 'Pelo menos 10 caracteres',
    'ordersWaiters.newWaiter.passwordHint':
      'Entregue esta palavra-passe ao empregado de forma segura.',
    'ordersWaiters.newWaiter.creating': 'A criar...',
    'ordersWaiters.newWaiter.submit': 'Criar conta de empregado',

    // waiters/page.tsx
    'ordersWaiters.staff.couldNotLoadStaff':
      'Não foi possível carregar a equipa',
    'ordersWaiters.staff.couldNotLoadTables':
      'Não foi possível carregar as mesas',
    'ordersWaiters.staff.couldNotLoadAssignments':
      'Não foi possível carregar as atribuições de mesas',
    'ordersWaiters.staff.couldNotCreateStaff':
      'Não foi possível criar a conta de funcionário',
    'ordersWaiters.staff.couldNotArchive':
      'Não foi possível arquivar a conta',
    'ordersWaiters.staff.couldNotPermanentlyDelete':
      'Não foi possível eliminar a conta permanentemente',
    'ordersWaiters.staff.onlyWaitersAssignable':
      'Apenas as contas de empregado podem ser atribuídas a mesas.',
    'ordersWaiters.staff.couldNotAssignTable':
      'Não foi possível atribuir a mesa',
    'ordersWaiters.staff.couldNotAssignSelf':
      'Não foi possível atribuir-se',
    'ordersWaiters.staff.couldNotRemoveAssignment':
      'Não foi possível remover a atribuição',
    'ordersWaiters.staff.confirmArchive':
      'Arquivar esta conta? Perderá o acesso de imediato, mas continuará disponível no Histórico de Equipa.',
    'ordersWaiters.staff.confirmPermanentDelete':
      'Eliminar esta conta permanentemente? A conta e o seu histórico serão removidos. Esta ação não pode ser desfeita.',
    'ordersWaiters.staff.archiving': 'A arquivar...',
    'ordersWaiters.staff.deleteAccount': 'Eliminar conta',
    'ordersWaiters.staff.loadingStaff': 'A carregar equipa...',
    'ordersWaiters.staff.eyebrow': 'Equipa do restaurante',
    'ordersWaiters.staff.pageTitle': 'Equipa',
    'ordersWaiters.staff.pageDescription':
      'Crie contas de funcionários, escolha o seu portal, atribua empregados a mesas e faça a gestão do histórico de contas.',
    'ordersWaiters.staff.statsLine':
      '{{waiters}} empregados · {{kitchen}} cozinha · {{assigned}} mesas atribuídas · Ao vivo',
    'ordersWaiters.staff.addStaffEyebrow': 'Adicionar funcionário',
    'ordersWaiters.staff.addStaffDescription':
      'O gerente escolhe se esta conta é de Empregado ou de Cozinha.',
    'ordersWaiters.staff.roleWaiter': 'Empregado',
    'ordersWaiters.staff.roleKitchen': 'Cozinha',
    'ordersWaiters.staff.fullNamePlaceholder': 'Nome completo',
    'ordersWaiters.staff.passwordPlaceholder': 'Palavra-passe (10+ caracteres)',
    'ordersWaiters.staff.creatingAccount': 'A criar...',
    'ordersWaiters.staff.createAccountButton': 'Criar conta de {{role}}',
    'ordersWaiters.staff.selfAssignEyebrow': 'Autoatribuição do gerente',
    'ordersWaiters.staff.selfAssignDescription':
      'O gerente também pode responsabilizar-se diretamente por uma mesa.',
    'ordersWaiters.staff.allTablesAssigned':
      'Todas as mesas ativas já têm uma atribuição principal.',
    'ordersWaiters.staff.assigningEllipsis': 'A atribuir...',
    'ordersWaiters.staff.assignMyself': 'Atribuir-me · {{label}}',
    'ordersWaiters.staff.serviceStaffEyebrow': 'Pessoal de sala',
    'ordersWaiters.staff.waitersHeading': 'Empregados',
    'ordersWaiters.staff.waitersDescription':
      'Apenas as contas de empregado ativas podem ser atribuídas a mesas.',
    'ordersWaiters.staff.noActiveWaiters': 'Sem empregados ativos',
    'ordersWaiters.staff.createWaiterAbove':
      'Crie uma conta de Empregado acima.',
    'ordersWaiters.staff.assignedTablesLabel': 'Mesas atribuídas',
    'ordersWaiters.staff.noTablesAssigned': 'Sem mesas atribuídas.',
    'ordersWaiters.staff.rolePrimary': 'Principal',
    'ordersWaiters.staff.roleAssisting': 'Auxiliar',
    'ordersWaiters.staff.selectTablePlaceholder': 'Selecione uma mesa',
    'ordersWaiters.staff.assignTableButton': 'Atribuir mesa',
    'ordersWaiters.staff.operationsEyebrow': 'Operações',
    'ordersWaiters.staff.kitchenStaffHeading': 'Pessoal de cozinha',
    'ordersWaiters.staff.kitchenStaffDescription':
      'As contas de cozinha podem aceder ao portal da Cozinha e não podem ser atribuídas a mesas.',
    'ordersWaiters.staff.noActiveKitchen': 'Sem contas de cozinha ativas',
    'ordersWaiters.staff.createKitchenAbove':
      'Crie uma conta de Cozinha acima.',
    'ordersWaiters.staff.portalLabel': 'Portal',
    'ordersWaiters.staff.historyEyebrow': 'Histórico',
    'ordersWaiters.staff.archivedStaffHeading': 'Equipa arquivada',
    'ordersWaiters.staff.archivedStaffDescription':
      'As contas arquivadas permanecem aqui até serem eliminadas permanentemente.',
    'ordersWaiters.staff.noArchivedStaff':
      'Sem contas de equipa arquivadas.',
    'ordersWaiters.staff.archivedBadge': 'Arquivado',
    'ordersWaiters.staff.portalInlineLabel': 'Portal:',
    'ordersWaiters.staff.archivedDateLabel': 'Arquivado:',
    'ordersWaiters.staff.unknownDate': 'Desconhecido',
    'ordersWaiters.staff.deletingPermanently':
      'A eliminar permanentemente...',
    'ordersWaiters.staff.deletePermanently': 'Eliminar permanentemente',
    'ordersWaiters.staff.permanentDeleteNote':
      'Esta ação remove a conta de forma permanente.',
    'ordersWaiters.staff.operationsFooterHeading': 'Operações de equipa',
    'ordersWaiters.staff.opNote1':
      'Os gerentes criam contas de Empregado e de Cozinha nesta página.',
    'ordersWaiters.staff.opNote2':
      'Eliminar uma conta ativa primeiro arquiva-a e desativa o acesso.',
    'ordersWaiters.staff.opNote3':
      'As contas arquivadas continuam disponíveis no Histórico de Equipa.',
    'ordersWaiters.staff.opNote4':
      'A eliminação permanente é um segundo passo separado.',
    'ordersWaiters.staff.opNote5':
      'Os empregados podem ser atribuídos a mesas. As contas de cozinha não podem.',
  },
  de: {
    // orders/page.tsx
    'ordersWaiters.orders.readyNoticeTitle': 'Bestellung fertig',
    'ordersWaiters.orders.readyNoticeBody':
      'Bestellung Nr. {{number}} ist abholbereit.',
    'ordersWaiters.orders.dismiss': 'Verwerfen',
    'ordersWaiters.orders.eyebrow': 'Service',
    'ordersWaiters.orders.title': 'Abholbereit',
    'ordersWaiters.orders.countSingular': '{{count}} Bestellung',
    'ordersWaiters.orders.countPlural': '{{count}} Bestellungen',
    'ordersWaiters.orders.emptyTitle': 'Alles erledigt',
    'ordersWaiters.orders.emptyBody':
      'Die Küche benachrichtigt dich, wenn eine Bestellung fertig ist.',
    'ordersWaiters.orders.tablePrefix': 'Tisch {{label}}',
    'ordersWaiters.orders.orderNumber': 'Bestellung Nr. {{number}}',
    'ordersWaiters.orders.statusReady': 'FERTIG',
    'ordersWaiters.orders.markServed': 'Als serviert markieren',

    // waiters/new/page.tsx
    'ordersWaiters.newWaiter.couldNotCreate':
      'Mitarbeiterkonto konnte nicht erstellt werden',
    'ordersWaiters.newWaiter.eyebrow': 'Personalverwaltung',
    'ordersWaiters.newWaiter.title': 'Kellner hinzufügen',
    'ordersWaiters.newWaiter.description':
      'Erstelle den Benutzernamen/die E-Mail-Adresse und das Passwort, mit denen der Kellner auf Küche und Service zugreift.',
    'ordersWaiters.newWaiter.fullNameLabel': 'Vollständiger Name',
    'ordersWaiters.newWaiter.fullNamePlaceholder': 'Maria Garcia',
    'ordersWaiters.newWaiter.usernameEmailLabel': 'Benutzername / E-Mail',
    'ordersWaiters.newWaiter.emailPlaceholder': 'maria@restaurant.com',
    'ordersWaiters.newWaiter.tempPasswordLabel': 'Temporäres Passwort',
    'ordersWaiters.newWaiter.passwordPlaceholder': 'Mindestens 10 Zeichen',
    'ordersWaiters.newWaiter.passwordHint':
      'Gib dieses Passwort dem Kellner auf sicherem Weg.',
    'ordersWaiters.newWaiter.creating': 'Wird erstellt...',
    'ordersWaiters.newWaiter.submit': 'Kellnerkonto erstellen',

    // waiters/page.tsx
    'ordersWaiters.staff.couldNotLoadStaff':
      'Personal konnte nicht geladen werden',
    'ordersWaiters.staff.couldNotLoadTables':
      'Tische konnten nicht geladen werden',
    'ordersWaiters.staff.couldNotLoadAssignments':
      'Tischzuweisungen konnten nicht geladen werden',
    'ordersWaiters.staff.couldNotCreateStaff':
      'Mitarbeiterkonto konnte nicht erstellt werden',
    'ordersWaiters.staff.couldNotArchive':
      'Konto konnte nicht archiviert werden',
    'ordersWaiters.staff.couldNotPermanentlyDelete':
      'Konto konnte nicht dauerhaft gelöscht werden',
    'ordersWaiters.staff.onlyWaitersAssignable':
      'Nur Kellnerkonten können Tischen zugewiesen werden.',
    'ordersWaiters.staff.couldNotAssignTable':
      'Tisch konnte nicht zugewiesen werden',
    'ordersWaiters.staff.couldNotAssignSelf':
      'Du konntest dir nicht zugewiesen werden',
    'ordersWaiters.staff.couldNotRemoveAssignment':
      'Zuweisung konnte nicht entfernt werden',
    'ordersWaiters.staff.confirmArchive':
      'Dieses Konto archivieren? Der Zugriff wird sofort entzogen, bleibt aber im Personalverlauf verfügbar.',
    'ordersWaiters.staff.confirmPermanentDelete':
      'Dieses Konto dauerhaft löschen? Das Konto und sein Personalverlauf werden entfernt. Dies kann nicht rückgängig gemacht werden.',
    'ordersWaiters.staff.archiving': 'Wird archiviert...',
    'ordersWaiters.staff.deleteAccount': 'Konto löschen',
    'ordersWaiters.staff.loadingStaff': 'Personal wird geladen...',
    'ordersWaiters.staff.eyebrow': 'Restaurantpersonal',
    'ordersWaiters.staff.pageTitle': 'Personal',
    'ordersWaiters.staff.pageDescription':
      'Erstelle Mitarbeiterkonten, wähle deren Portal, weise Kellnern Tische zu und verwalte den Kontoverlauf.',
    'ordersWaiters.staff.statsLine':
      '{{waiters}} Kellner · {{kitchen}} Küche · {{assigned}} zugewiesene Tische · Live',
    'ordersWaiters.staff.addStaffEyebrow': 'Personal hinzufügen',
    'ordersWaiters.staff.addStaffDescription':
      'Der Manager legt fest, ob dieses Konto ein Kellner- oder Küchenkonto ist.',
    'ordersWaiters.staff.roleWaiter': 'Kellner',
    'ordersWaiters.staff.roleKitchen': 'Küche',
    'ordersWaiters.staff.fullNamePlaceholder': 'Vollständiger Name',
    'ordersWaiters.staff.passwordPlaceholder': 'Passwort (mind. 10 Zeichen)',
    'ordersWaiters.staff.creatingAccount': 'Wird erstellt...',
    'ordersWaiters.staff.createAccountButton': '{{role}}-Konto erstellen',
    'ordersWaiters.staff.selfAssignEyebrow': 'Selbstzuweisung des Managers',
    'ordersWaiters.staff.selfAssignDescription':
      'Der Manager kann auch direkt die Verantwortung für einen Tisch übernehmen.',
    'ordersWaiters.staff.allTablesAssigned':
      'Jeder aktive Tisch hat bereits eine Hauptzuweisung.',
    'ordersWaiters.staff.assigningEllipsis': 'Wird zugewiesen...',
    'ordersWaiters.staff.assignMyself': 'Mir zuweisen · {{label}}',
    'ordersWaiters.staff.serviceStaffEyebrow': 'Servicepersonal',
    'ordersWaiters.staff.waitersHeading': 'Kellner',
    'ordersWaiters.staff.waitersDescription':
      'Nur aktive Kellnerkonten können Tischen zugewiesen werden.',
    'ordersWaiters.staff.noActiveWaiters': 'Keine aktiven Kellner',
    'ordersWaiters.staff.createWaiterAbove':
      'Erstelle oben ein Kellnerkonto.',
    'ordersWaiters.staff.assignedTablesLabel': 'Zugewiesene Tische',
    'ordersWaiters.staff.noTablesAssigned': 'Keine Tische zugewiesen.',
    'ordersWaiters.staff.rolePrimary': 'Primär',
    'ordersWaiters.staff.roleAssisting': 'Unterstützend',
    'ordersWaiters.staff.selectTablePlaceholder': 'Tisch auswählen',
    'ordersWaiters.staff.assignTableButton': 'Tisch zuweisen',
    'ordersWaiters.staff.operationsEyebrow': 'Betrieb',
    'ordersWaiters.staff.kitchenStaffHeading': 'Küchenpersonal',
    'ordersWaiters.staff.kitchenStaffDescription':
      'Küchenkonten können auf das Küchenportal zugreifen und können keinen Tischen zugewiesen werden.',
    'ordersWaiters.staff.noActiveKitchen': 'Keine aktiven Küchenkonten',
    'ordersWaiters.staff.createKitchenAbove':
      'Erstelle oben ein Küchenkonto.',
    'ordersWaiters.staff.portalLabel': 'Portal',
    'ordersWaiters.staff.historyEyebrow': 'Verlauf',
    'ordersWaiters.staff.archivedStaffHeading': 'Archiviertes Personal',
    'ordersWaiters.staff.archivedStaffDescription':
      'Archivierte Konten bleiben hier gespeichert, bis sie dauerhaft gelöscht werden.',
    'ordersWaiters.staff.noArchivedStaff':
      'Keine archivierten Mitarbeiterkonten.',
    'ordersWaiters.staff.archivedBadge': 'Archiviert',
    'ordersWaiters.staff.portalInlineLabel': 'Portal:',
    'ordersWaiters.staff.archivedDateLabel': 'Archiviert:',
    'ordersWaiters.staff.unknownDate': 'Unbekannt',
    'ordersWaiters.staff.deletingPermanently': 'Wird dauerhaft gelöscht...',
    'ordersWaiters.staff.deletePermanently': 'Dauerhaft löschen',
    'ordersWaiters.staff.permanentDeleteNote':
      'Diese Aktion entfernt das Konto dauerhaft.',
    'ordersWaiters.staff.operationsFooterHeading': 'Personalbetrieb',
    'ordersWaiters.staff.opNote1':
      'Manager erstellen auf dieser Seite Kellner- und Küchenkonten.',
    'ordersWaiters.staff.opNote2':
      'Beim Löschen eines aktiven Kontos wird es zunächst archiviert und der Zugriff deaktiviert.',
    'ordersWaiters.staff.opNote3':
      'Archivierte Konten bleiben im Personalverlauf verfügbar.',
    'ordersWaiters.staff.opNote4':
      'Die dauerhafte Löschung ist ein separater zweiter Schritt.',
    'ordersWaiters.staff.opNote5':
      'Kellner können Tischen zugewiesen werden. Küchenkonten nicht.',
  },
  fr: {
    // orders/page.tsx
    'ordersWaiters.orders.readyNoticeTitle': 'Commande prête',
    'ordersWaiters.orders.readyNoticeBody':
      'La commande n°{{number}} est prête à être récupérée.',
    'ordersWaiters.orders.dismiss': 'Ignorer',
    'ordersWaiters.orders.eyebrow': 'Service',
    'ordersWaiters.orders.title': 'Prêt à emporter',
    'ordersWaiters.orders.countSingular': '{{count}} commande',
    'ordersWaiters.orders.countPlural': '{{count}} commandes',
    'ordersWaiters.orders.emptyTitle': 'Tout est à jour',
    'ordersWaiters.orders.emptyBody':
      'La cuisine vous préviendra quand une commande sera prête.',
    'ordersWaiters.orders.tablePrefix': 'Table {{label}}',
    'ordersWaiters.orders.orderNumber': 'Commande n°{{number}}',
    'ordersWaiters.orders.statusReady': 'PRÊT',
    'ordersWaiters.orders.markServed': 'Marquer comme servi',

    // waiters/new/page.tsx
    'ordersWaiters.newWaiter.couldNotCreate':
      'Impossible de créer le compte du serveur',
    'ordersWaiters.newWaiter.eyebrow': 'Gestion du personnel',
    'ordersWaiters.newWaiter.title': 'Ajouter un serveur',
    'ordersWaiters.newWaiter.description':
      "Créez le nom d'utilisateur/e-mail et le mot de passe que le serveur utilisera pour accéder à la Cuisine et au Service.",
    'ordersWaiters.newWaiter.fullNameLabel': 'Nom complet',
    'ordersWaiters.newWaiter.fullNamePlaceholder': 'Maria Garcia',
    'ordersWaiters.newWaiter.usernameEmailLabel': "Nom d'utilisateur / e-mail",
    'ordersWaiters.newWaiter.emailPlaceholder': 'maria@restaurant.com',
    'ordersWaiters.newWaiter.tempPasswordLabel': 'Mot de passe temporaire',
    'ordersWaiters.newWaiter.passwordPlaceholder': 'Au moins 10 caractères',
    'ordersWaiters.newWaiter.passwordHint':
      'Communiquez ce mot de passe au serveur de manière sécurisée.',
    'ordersWaiters.newWaiter.creating': 'Création...',
    'ordersWaiters.newWaiter.submit': 'Créer le compte serveur',

    // waiters/page.tsx
    'ordersWaiters.staff.couldNotLoadStaff':
      'Impossible de charger le personnel',
    'ordersWaiters.staff.couldNotLoadTables':
      'Impossible de charger les tables',
    'ordersWaiters.staff.couldNotLoadAssignments':
      'Impossible de charger les attributions de tables',
    'ordersWaiters.staff.couldNotCreateStaff':
      'Impossible de créer le compte du personnel',
    'ordersWaiters.staff.couldNotArchive':
      "Impossible d'archiver le compte",
    'ordersWaiters.staff.couldNotPermanentlyDelete':
      'Impossible de supprimer définitivement le compte',
    'ordersWaiters.staff.onlyWaitersAssignable':
      'Seuls les comptes serveur peuvent être attribués à des tables.',
    'ordersWaiters.staff.couldNotAssignTable':
      "Impossible d'attribuer la table",
    'ordersWaiters.staff.couldNotAssignSelf':
      'Impossible de vous attribuer la table',
    'ordersWaiters.staff.couldNotRemoveAssignment':
      "Impossible de supprimer l'attribution",
    'ordersWaiters.staff.confirmArchive':
      "Archiver ce compte ? L'accès sera immédiatement perdu, mais il restera disponible dans l'historique du personnel.",
    'ordersWaiters.staff.confirmPermanentDelete':
      'Supprimer définitivement ce compte ? Le compte et son historique seront supprimés. Cette action est irréversible.',
    'ordersWaiters.staff.archiving': 'Archivage...',
    'ordersWaiters.staff.deleteAccount': 'Supprimer le compte',
    'ordersWaiters.staff.loadingStaff': 'Chargement du personnel...',
    'ordersWaiters.staff.eyebrow': 'Personnel du restaurant',
    'ordersWaiters.staff.pageTitle': 'Personnel',
    'ordersWaiters.staff.pageDescription':
      "Créez des comptes du personnel, choisissez leur portail, attribuez des serveurs aux tables et gérez l'historique des comptes.",
    'ordersWaiters.staff.statsLine':
      '{{waiters}} serveurs · {{kitchen}} cuisine · {{assigned}} tables attribuées · En direct',
    'ordersWaiters.staff.addStaffEyebrow': 'Ajouter du personnel',
    'ordersWaiters.staff.addStaffDescription':
      'Le responsable choisit si ce compte est un compte Serveur ou Cuisine.',
    'ordersWaiters.staff.roleWaiter': 'Serveur',
    'ordersWaiters.staff.roleKitchen': 'Cuisine',
    'ordersWaiters.staff.fullNamePlaceholder': 'Nom complet',
    'ordersWaiters.staff.passwordPlaceholder': 'Mot de passe (10+ caractères)',
    'ordersWaiters.staff.creatingAccount': 'Création...',
    'ordersWaiters.staff.createAccountButton': 'Créer un compte {{role}}',
    'ordersWaiters.staff.selfAssignEyebrow': 'Auto-attribution du responsable',
    'ordersWaiters.staff.selfAssignDescription':
      'Le responsable peut aussi prendre directement en charge une table.',
    'ordersWaiters.staff.allTablesAssigned':
      'Chaque table active a déjà une attribution principale.',
    'ordersWaiters.staff.assigningEllipsis': 'Attribution...',
    'ordersWaiters.staff.assignMyself': "M'attribuer · {{label}}",
    'ordersWaiters.staff.serviceStaffEyebrow': 'Personnel de salle',
    'ordersWaiters.staff.waitersHeading': 'Serveurs',
    'ordersWaiters.staff.waitersDescription':
      'Seuls les comptes serveur actifs peuvent être attribués à des tables.',
    'ordersWaiters.staff.noActiveWaiters': 'Aucun serveur actif',
    'ordersWaiters.staff.createWaiterAbove':
      'Créez un compte Serveur ci-dessus.',
    'ordersWaiters.staff.assignedTablesLabel': 'Tables attribuées',
    'ordersWaiters.staff.noTablesAssigned': 'Aucune table attribuée.',
    'ordersWaiters.staff.rolePrimary': 'Principal',
    'ordersWaiters.staff.roleAssisting': 'Assistant',
    'ordersWaiters.staff.selectTablePlaceholder': 'Sélectionner une table',
    'ordersWaiters.staff.assignTableButton': 'Attribuer la table',
    'ordersWaiters.staff.operationsEyebrow': 'Opérations',
    'ordersWaiters.staff.kitchenStaffHeading': 'Personnel de cuisine',
    'ordersWaiters.staff.kitchenStaffDescription':
      'Les comptes cuisine peuvent accéder au portail Cuisine et ne peuvent pas être attribués à des tables.',
    'ordersWaiters.staff.noActiveKitchen': 'Aucun compte cuisine actif',
    'ordersWaiters.staff.createKitchenAbove':
      'Créez un compte Cuisine ci-dessus.',
    'ordersWaiters.staff.portalLabel': 'Portail',
    'ordersWaiters.staff.historyEyebrow': 'Historique',
    'ordersWaiters.staff.archivedStaffHeading': 'Personnel archivé',
    'ordersWaiters.staff.archivedStaffDescription':
      'Les comptes archivés restent stockés ici jusqu\'à leur suppression définitive.',
    'ordersWaiters.staff.noArchivedStaff':
      'Aucun compte du personnel archivé.',
    'ordersWaiters.staff.archivedBadge': 'Archivé',
    'ordersWaiters.staff.portalInlineLabel': 'Portail :',
    'ordersWaiters.staff.archivedDateLabel': 'Archivé :',
    'ordersWaiters.staff.unknownDate': 'Inconnu',
    'ordersWaiters.staff.deletingPermanently': 'Suppression définitive...',
    'ordersWaiters.staff.deletePermanently': 'Supprimer définitivement',
    'ordersWaiters.staff.permanentDeleteNote':
      'Cette action supprime définitivement le compte.',
    'ordersWaiters.staff.operationsFooterHeading': 'Opérations du personnel',
    'ordersWaiters.staff.opNote1':
      'Les responsables créent les comptes Serveur et Cuisine depuis cette page.',
    'ordersWaiters.staff.opNote2':
      "La suppression d'un compte actif l'archive d'abord et désactive l'accès.",
    'ordersWaiters.staff.opNote3':
      "Les comptes archivés restent disponibles dans l'historique du personnel.",
    'ordersWaiters.staff.opNote4':
      'La suppression définitive est une seconde étape distincte.',
    'ordersWaiters.staff.opNote5':
      'Les serveurs peuvent être attribués à des tables. Les comptes cuisine ne le peuvent pas.',
  },
};
