import type { Locale } from '../locales';

/**
 * Menu editor + import, and Tables management:
 * app/dashboard/[restaurantId]/menu/page.tsx,
 * app/dashboard/[restaurantId]/menu/import/page.tsx,
 * app/dashboard/[restaurantId]/tables/page.tsx.
 */
export const menuTables: Record<Locale, Record<string, string>> = {
  es: {
    // menu/poster/page.tsx
    'menuTables.poster.title': 'Colocar platos sobre la foto',
    'menuTables.poster.subtitle':
      'Arrastra cada plato a su sitio sobre tu foto. Los que no coloques aparecerán en la lista normal debajo.',
    'menuTables.poster.loading': 'Cargando…',
    'menuTables.poster.noBackground':
      'Todavía no tienes una foto de fondo. Impórtala desde "Importar desde fotos" o súbela en Ajustes.',
    'menuTables.poster.couldNotLoad': 'No se pudo cargar.',
    'menuTables.poster.couldNotSave': 'No se pudo guardar la posición.',
    'menuTables.poster.unplacedHeading': 'Platos sin colocar',
    'menuTables.poster.allPlaced': 'Has colocado todos los platos.',
    'menuTables.poster.place': 'Colocar',
    'menuTables.poster.remove': 'Quitar',
    'menuTables.poster.dragHint': 'Arrastra las etiquetas sobre la foto para ajustar su posición.',
    // menu/page.tsx
    'menuTables.editor.eyebrow': 'Menú del restaurante',
    'menuTables.editor.heading': 'Menú',
    'menuTables.editor.subheading':
      'Añade platos, actualiza precios y controla la disponibilidad.',
    'menuTables.editor.importFromPhotos': 'Importar desde fotos',
    'menuTables.editor.loadingMenu': 'Cargando menú...',
    'menuTables.editor.couldNotLoadMenu': 'No se pudo cargar el menú',
    'menuTables.editor.couldNotLoadRestaurant':
      'No se pudo cargar el restaurante',
    'menuTables.editor.couldNotCreateCategory':
      'No se pudo crear la categoría',
    'menuTables.editor.couldNotUpdateAvailability':
      'No se pudo actualizar la disponibilidad',
    'menuTables.editor.couldNotDeleteItem': 'No se pudo eliminar el artículo',
    'menuTables.editor.couldNotCreateItem': 'No se pudo crear el artículo',
    'menuTables.editor.couldNotUpdateItem':
      'No se pudo actualizar el artículo',
    'menuTables.editor.confirmDeleteItem':
      '¿Eliminar "{{name}}"? Si tiene historial de pedidos, se marcará como no disponible en su lugar.',
    'menuTables.editor.itemSingular': 'artículo',
    'menuTables.editor.itemPlural': 'artículos',
    'menuTables.editor.addItem': 'Añadir artículo',
    'menuTables.editor.noItemsYet': 'Todavía no hay artículos en esta categoría.',
    'menuTables.editor.available': 'Disponible',
    'menuTables.editor.unavailable': 'No disponible',
    'menuTables.editor.markUnavailable': 'Marcar como no disponible',
    'menuTables.editor.markAvailable': 'Marcar como disponible',
    'menuTables.editor.addCategory': 'Añadir categoría',
    'menuTables.editor.categoryKindLabel': 'Tipo',
    'menuTables.editor.categoryKindFood': 'Comida',
    'menuTables.editor.categoryKindDrinks': 'Bebidas',
    'menuTables.editor.categoryKindDessert': 'Postres',
    'menuTables.editor.categoryKindDrinksHint': 'No requiere elaboración — la cocina puede enviarlo directo al camarero.',
    'menuTables.editor.couldNotUpdateCategoryKind': 'No se pudo actualizar el tipo de categoría',
    'menuTables.editor.categoryNamePlaceholder':
      'Ej. Entrantes, Pasta, Postres',
    'menuTables.editor.enterItemName': 'Introduce el nombre del artículo.',
    'menuTables.editor.enterValidPrice': 'Introduce un precio válido.',
    'menuTables.editor.enterValidVatRate':
      'Introduce un tipo de IVA válido (0-100%).',
    'menuTables.editor.vatRateLabel': 'IVA',
    'menuTables.editor.vatRateCustomOption': 'Personalizado…',
    'menuTables.editor.vatRateCustomPlaceholder': '% personalizado',
    'menuTables.editor.vatBadge': 'IVA {{rate}}%',
    'menuTables.editor.allergensLabel': 'Alérgenos',
    'menuTables.editor.dietaryTagsLabel': 'Etiquetas dietéticas',
    'menuTables.editor.invalidImageUrl':
      'La URL de la imagen debe ser válida.',
    'menuTables.editor.dishNamePlaceholder': 'Nombre del plato',
    'menuTables.editor.pricePlaceholder': 'Precio ({{currency}})',
    'menuTables.editor.shortDescriptionPlaceholder': 'Descripción breve',
    'menuTables.editor.imageUrlOptionalPlaceholder':
      'URL de la imagen (opcional)',
    'menuTables.editor.saveItem': 'Guardar artículo',
    'menuTables.editor.descriptionPlaceholder': 'Descripción',
    'menuTables.editor.imageUrlPlaceholder': 'URL de la imagen',
    'menuTables.editor.saveChanges': 'Guardar cambios',

    // menu/import/page.tsx
    'menuTables.import.subheading':
      'Haz algunas fotos claras de tu carta actual en papel o PDF. La IA las leerá y creará el borrador de tu menú online — tú revisas y editas todo antes de publicarlo.',
    'menuTables.import.couldNotReadFile': 'No se pudo leer {{name}}',
    'menuTables.import.couldNotDecodeFile':
      'No se pudo decodificar {{name}}',
    'menuTables.import.canvasNotSupported':
      'Este navegador no admite canvas.',
    'menuTables.import.couldNotReadPhotos':
      'No se pudieron leer las fotos seleccionadas.',
    'menuTables.import.chooseAtLeastOnePhoto':
      'Elige al menos una foto del menú primero.',
    'menuTables.import.couldNotAnalyzePhotos':
      'No se pudieron analizar las fotos del menú.',
    'menuTables.import.noItemsFound':
      'La IA no encontró ningún artículo de menú en estas fotos. Prueba con fotos más claras y bien iluminadas de todo el menú.',
    'menuTables.import.couldNotPublishMenu':
      'No se pudo publicar el menú.',
    'menuTables.import.photosSelected':
      '{{count}} foto(s) seleccionadas — toca para cambiar',
    'menuTables.import.tapToChoosePhotos':
      'Toca para elegir fotos del menú',
    'menuTables.import.menuPhotoAlt': 'Foto del menú {{number}}',
    'menuTables.import.readingWithAi': 'Leyendo tu menú con IA...',
    'menuTables.import.analyzeWithAi': 'Analizar con IA',
    'menuTables.import.reviewSubheading':
      'Revisa lo que encontró la IA. Corrige lo que esté mal, elimina lo que no quieras y publica. Esto se añade a tu menú actual — no se elimina nada.',
    'menuTables.import.removeCategory': 'Eliminar categoría',
    'menuTables.import.itemNamePlaceholder': 'Nombre del artículo',
    'menuTables.import.descriptionOptionalPlaceholder':
      'Descripción (opcional)',
    'menuTables.import.pricePlaceholderZero': '0.00',
    'menuTables.import.noItemsInCategory': 'No hay artículos en esta categoría.',
    'menuTables.import.publishing': 'Publicando...',
    'menuTables.import.publishMenu': 'Publicar menú',
    'menuTables.import.brandingHeading': 'Estética sugerida',
    'menuTables.import.applyBranding': 'Aplicar a mi restaurante',
    'menuTables.import.brandingFontSample': 'Tu Restaurante',
    'menuTables.import.brandingHint':
      'La IA sugirió estos visuales a partir de las fotos. Puedes desmarcar la casilla para no aplicarlos, o cambiarlos luego en Ajustes.',
    'menuTables.import.backgroundHeading': 'Fondo de la carta',
    'menuTables.import.applyBackground': 'Usar como fondo de mi carta',
    'menuTables.import.backgroundPreviewSample': 'Así se vería',
    'menuTables.import.backgroundHint':
      'Es tu propia foto, difuminada y atenuada para que el texto siga siendo legible — no borramos ni recolocamos nada de la foto original. Puedes cambiarla luego en Ajustes.',
    'menuTables.import.summaryDetected': '{{count}} productos detectados.',
    'menuTables.import.summaryReady': '{{count}} productos listos.',
    'menuTables.import.summaryNeedsAttention': '{{count}} necesitan tu atención.',
    'menuTables.import.jumpToNext': 'Ver siguiente',
    'menuTables.import.issueMissingPrice': 'REVISAR PRECIO',
    'menuTables.import.issueDuplicateName': 'Nombre duplicado en esta categoría',
    'menuTables.import.issueEmptyCategory': 'Esta categoría no tiene artículos',
    'menuTables.import.issueUncertainCategory': 'La IA no está segura de esta categoría',
    'menuTables.import.issueLowConfidence': 'La IA no está segura de este producto',
    'menuTables.import.needsReviewReason': 'La IA no está totalmente segura — revísalo',
    'menuTables.import.uncertainField.name': 'Nombre por confirmar',
    'menuTables.import.uncertainField.description': 'Descripción por confirmar',
    'menuTables.import.uncertainField.price': 'Precio por confirmar',
    'menuTables.import.uncertainField.allergens': 'Alérgenos por confirmar',
    'menuTables.import.uncertainField.dietaryTags': 'Etiquetas dietéticas por confirmar',
    'menuTables.import.uncertainField.modifiers': 'Modificadores por confirmar',
    'menuTables.import.fixIssuesBeforePublishing':
      'Corrige los avisos señalados antes de publicar.',
    'menuTables.import.modifierSingle': 'Elige uno',
    'menuTables.import.modifierMultiple': 'Elige varios',

    // tables/page.tsx
    'menuTables.tables.justNow': 'justo ahora',
    'menuTables.tables.oneMinAgo': 'hace 1 min',
    'menuTables.tables.minsAgo': 'hace {{minutes}} min',
    'menuTables.tables.statusNew': 'Nuevo',
    'menuTables.tables.statusAccepted': 'Aceptado',
    'menuTables.tables.statusPreparing': 'Preparando',
    'menuTables.tables.statusReady': 'Listo',
    'menuTables.tables.statusCompleted': 'Completado',
    'menuTables.tables.statusServed': 'Servido',
    'menuTables.tables.couldNotLoadTables': 'No se pudieron cargar las mesas',
    'menuTables.tables.couldNotLoadActiveOrders':
      'No se pudieron cargar los pedidos activos',
    'menuTables.tables.couldNotLoadOrderHistory':
      'No se pudo cargar el historial de pedidos',
    'menuTables.tables.couldNotCreateTable': 'No se pudo crear la mesa',
    'menuTables.tables.tableNameEmpty':
      'El nombre de la mesa no puede estar vacío.',
    'menuTables.tables.couldNotUpdateTable': 'No se pudo actualizar la mesa',
    'menuTables.tables.confirmDeleteTable':
      '¿Eliminar "{{label}}"? Si tiene historial de pedidos, se desactivará en su lugar.',
    'menuTables.tables.couldNotDeleteTable': 'No se pudo eliminar la mesa',
    'menuTables.tables.couldNotCopyUrl': 'No se pudo copiar la URL.',
    'menuTables.tables.loadingTables': 'Cargando mesas...',
    'menuTables.tables.restaurantFallback': 'Restaurante',
    'menuTables.tables.heading': 'Mesas',
    'menuTables.tables.subheading':
      'Gestiona las mesas, los enlaces QR/NFC y consulta lo que ocurre en cada mesa.',
    'menuTables.tables.activeTotalSummary':
      '{{active}} activas · {{total}} en total',
    'menuTables.tables.live': 'En directo',
    'menuTables.tables.offline': 'Sin conexión',
    'menuTables.tables.addTable': 'Añadir mesa',
    'menuTables.tables.tableNamePlaceholder':
      'Mesa 7, Terraza 2, Patio 4...',
    'menuTables.tables.adding': 'Añadiendo...',
    'menuTables.tables.noTablesYet': 'Todavía no hay mesas',
    'menuTables.tables.addFirstTableAbove': 'Añade tu primera mesa arriba.',
    'menuTables.tables.qrCodeAlt': 'Código QR de {{label}}',
    'menuTables.tables.downloadQr': 'Descargar QR',
    'menuTables.tables.couldNotBuildQrCard': 'No se pudo generar la tarjeta QR',
    'menuTables.tables.qrCardEyebrow': 'Escanea para pedir',
    'menuTables.tables.qrCardTableEyebrow': 'Mesa',
    'menuTables.tables.qrCardScanToOrder': 'Escanea el código para ver el menú y pedir',
    'menuTables.tables.copied': '¡Copiado!',
    'menuTables.tables.copyUrl': 'Copiar URL',
    'menuTables.tables.openMenu': 'Abrir menú',
    'menuTables.tables.deactivate': 'Desactivar',
    'menuTables.tables.activate': 'Activar',
    'menuTables.tables.deleteTable': 'Eliminar mesa',
    'menuTables.tables.currentActivity': 'Actividad actual',
    'menuTables.tables.noActiveOrder': 'Sin pedido activo',
    'menuTables.tables.activeOrdersCountSingular': '{{count}} pedido activo',
    'menuTables.tables.activeOrdersCountPlural': '{{count}} pedidos activos',
    'menuTables.tables.orderNumber': 'Pedido n.º {{number}}',
    'menuTables.tables.itemFallback': 'Artículo',
    'menuTables.tables.currentOrderLabel': 'Pedido actual',
    'menuTables.tables.totalSpent': 'Total gastado',
    'menuTables.tables.completedOrders': 'Pedidos completados',
    'menuTables.tables.orderProgress': 'Progreso del pedido',
    'menuTables.tables.qrNfcHeading': 'QR y NFC',
    'menuTables.tables.qrNfcParagraph1':
      'Cada mesa tiene su propia URL de cliente única. El código QR y la etiqueta NFC deben usar exactamente la misma URL.',
    'menuTables.tables.qrNfcParagraph2':
      'Usa "{{copyUrl}}" para programar una pegatina NFC, o "{{downloadQr}}" para imprimir el código QR de la mesa.',
    'menuTables.tables.qrNfcParagraph3':
      'Esta página también muestra el pedido actual, la fase del pedido y el gasto completado de cada mesa.',
  },
  en: {
    // menu/poster/page.tsx
    'menuTables.poster.title': 'Place dishes on the photo',
    'menuTables.poster.subtitle':
      'Drag each dish into place on your photo. Anything you don\'t place shows up in the normal list below.',
    'menuTables.poster.loading': 'Loading…',
    'menuTables.poster.noBackground':
      'You don\'t have a background photo yet. Import one from "Import from photos" or upload one in Settings.',
    'menuTables.poster.couldNotLoad': 'Could not load.',
    'menuTables.poster.couldNotSave': 'Could not save the position.',
    'menuTables.poster.unplacedHeading': 'Unplaced dishes',
    'menuTables.poster.allPlaced': 'You\'ve placed every dish.',
    'menuTables.poster.place': 'Place',
    'menuTables.poster.remove': 'Remove',
    'menuTables.poster.dragHint': 'Drag the labels on the photo to adjust their position.',
    // menu/page.tsx
    'menuTables.editor.eyebrow': 'Restaurant menu',
    'menuTables.editor.heading': 'Menu',
    'menuTables.editor.subheading':
      'Add dishes, update prices and control availability.',
    'menuTables.editor.importFromPhotos': 'Import from photos',
    'menuTables.editor.loadingMenu': 'Loading menu...',
    'menuTables.editor.couldNotLoadMenu': 'Could not load menu',
    'menuTables.editor.couldNotLoadRestaurant': 'Could not load restaurant',
    'menuTables.editor.couldNotCreateCategory': 'Could not create category',
    'menuTables.editor.couldNotUpdateAvailability':
      'Could not update availability',
    'menuTables.editor.couldNotDeleteItem': 'Could not delete item',
    'menuTables.editor.couldNotCreateItem': 'Could not create item',
    'menuTables.editor.couldNotUpdateItem': 'Could not update item',
    'menuTables.editor.confirmDeleteItem':
      'Delete "{{name}}"? If it has order history, it will be marked unavailable instead.',
    'menuTables.editor.itemSingular': 'item',
    'menuTables.editor.itemPlural': 'items',
    'menuTables.editor.addItem': 'Add item',
    'menuTables.editor.noItemsYet': 'No items in this category yet.',
    'menuTables.editor.available': 'Available',
    'menuTables.editor.unavailable': 'Unavailable',
    'menuTables.editor.markUnavailable': 'Mark unavailable',
    'menuTables.editor.markAvailable': 'Mark available',
    'menuTables.editor.addCategory': 'Add category',
    'menuTables.editor.categoryKindLabel': 'Kind',
    'menuTables.editor.categoryKindFood': 'Food',
    'menuTables.editor.categoryKindDrinks': 'Drinks',
    'menuTables.editor.categoryKindDessert': 'Dessert',
    'menuTables.editor.categoryKindDrinksHint': "Needs no preparation — kitchen can send it straight to the waiter.",
    'menuTables.editor.couldNotUpdateCategoryKind': 'Could not update the category kind',
    'menuTables.editor.categoryNamePlaceholder':
      'e.g. Starters, Pasta, Desserts',
    'menuTables.editor.enterItemName': 'Enter an item name.',
    'menuTables.editor.enterValidPrice': 'Enter a valid price.',
    'menuTables.editor.enterValidVatRate': 'Enter a valid VAT rate (0-100%).',
    'menuTables.editor.vatRateLabel': 'VAT',
    'menuTables.editor.vatRateCustomOption': 'Custom…',
    'menuTables.editor.vatRateCustomPlaceholder': 'Custom %',
    'menuTables.editor.vatBadge': 'VAT {{rate}}%',
    'menuTables.editor.allergensLabel': 'Allergens',
    'menuTables.editor.dietaryTagsLabel': 'Dietary tags',
    'menuTables.editor.invalidImageUrl': 'Image URL must be valid.',
    'menuTables.editor.dishNamePlaceholder': 'Dish name',
    'menuTables.editor.pricePlaceholder': 'Price ({{currency}})',
    'menuTables.editor.shortDescriptionPlaceholder': 'Short description',
    'menuTables.editor.imageUrlOptionalPlaceholder': 'Image URL (optional)',
    'menuTables.editor.saveItem': 'Save item',
    'menuTables.editor.descriptionPlaceholder': 'Description',
    'menuTables.editor.imageUrlPlaceholder': 'Image URL',
    'menuTables.editor.saveChanges': 'Save changes',

    // menu/import/page.tsx
    'menuTables.import.subheading':
      'Take a few clear photos of your existing paper or PDF menu. AI will read them and draft your online menu — you review and edit everything before it goes live.',
    'menuTables.import.couldNotReadFile': 'Could not read {{name}}',
    'menuTables.import.couldNotDecodeFile': 'Could not decode {{name}}',
    'menuTables.import.canvasNotSupported':
      'Canvas not supported in this browser.',
    'menuTables.import.couldNotReadPhotos':
      'Could not read the selected photos.',
    'menuTables.import.chooseAtLeastOnePhoto':
      'Choose at least one photo of the menu first.',
    'menuTables.import.couldNotAnalyzePhotos':
      'Could not analyze the menu photos.',
    'menuTables.import.noItemsFound':
      'The AI could not find any menu items in these photos. Try clearer, well-lit photos of the full menu.',
    'menuTables.import.couldNotPublishMenu': 'Could not publish the menu.',
    'menuTables.import.photosSelected':
      '{{count}} photo(s) selected — tap to change',
    'menuTables.import.tapToChoosePhotos': 'Tap to choose menu photos',
    'menuTables.import.menuPhotoAlt': 'Menu photo {{number}}',
    'menuTables.import.readingWithAi': 'Reading your menu with AI...',
    'menuTables.import.analyzeWithAi': 'Analyze with AI',
    'menuTables.import.reviewSubheading':
      "Review what the AI found. Fix anything that's wrong, remove what you don't want, then publish. This is added to your existing menu — nothing is deleted.",
    'menuTables.import.removeCategory': 'Remove category',
    'menuTables.import.itemNamePlaceholder': 'Item name',
    'menuTables.import.descriptionOptionalPlaceholder':
      'Description (optional)',
    'menuTables.import.pricePlaceholderZero': '0.00',
    'menuTables.import.noItemsInCategory': 'No items in this category.',
    'menuTables.import.publishing': 'Publishing...',
    'menuTables.import.publishMenu': 'Publish menu',
    'menuTables.import.brandingHeading': 'Suggested look',
    'menuTables.import.applyBranding': 'Apply to my restaurant',
    'menuTables.import.brandingFontSample': 'Your Restaurant',
    'menuTables.import.brandingHint':
      "The AI suggested this look from the photos. Uncheck the box to skip it, or change it later in Settings.",
    'menuTables.import.backgroundHeading': 'Menu background',
    'menuTables.import.applyBackground': 'Use as my menu background',
    'menuTables.import.backgroundPreviewSample': "That's how it'd look",
    'menuTables.import.backgroundHint':
      "It's your own photo, blurred and dimmed so the text stays readable — nothing in the original photo is erased or moved. You can change it later in Settings.",
    'menuTables.import.summaryDetected': '{{count}} items detected.',
    'menuTables.import.summaryReady': '{{count}} items are ready.',
    'menuTables.import.summaryNeedsAttention': '{{count}} need your attention.',
    'menuTables.import.jumpToNext': 'Show next',
    'menuTables.import.issueMissingPrice': 'REVIEW PRICE',
    'menuTables.import.issueDuplicateName': 'Duplicate name in this category',
    'menuTables.import.issueEmptyCategory': 'This category has no items',
    'menuTables.import.issueUncertainCategory': "The AI isn't sure about this category",
    'menuTables.import.issueLowConfidence': "The AI isn't sure about this item",
    'menuTables.import.needsReviewReason': "The AI isn't fully sure — please check",
    'menuTables.import.uncertainField.name': 'Name needs confirming',
    'menuTables.import.uncertainField.description': 'Description needs confirming',
    'menuTables.import.uncertainField.price': 'Price needs confirming',
    'menuTables.import.uncertainField.allergens': 'Allergens need confirming',
    'menuTables.import.uncertainField.dietaryTags': 'Dietary tags need confirming',
    'menuTables.import.uncertainField.modifiers': 'Modifiers need confirming',
    'menuTables.import.fixIssuesBeforePublishing':
      'Fix the flagged issues before publishing.',
    'menuTables.import.modifierSingle': 'Choose one',
    'menuTables.import.modifierMultiple': 'Choose multiple',

    // tables/page.tsx
    'menuTables.tables.justNow': 'just now',
    'menuTables.tables.oneMinAgo': '1 min ago',
    'menuTables.tables.minsAgo': '{{minutes}} min ago',
    'menuTables.tables.statusNew': 'New',
    'menuTables.tables.statusAccepted': 'Accepted',
    'menuTables.tables.statusPreparing': 'Preparing',
    'menuTables.tables.statusReady': 'Ready',
    'menuTables.tables.statusCompleted': 'Completed',
    'menuTables.tables.statusServed': 'Served',
    'menuTables.tables.couldNotLoadTables': 'Could not load tables',
    'menuTables.tables.couldNotLoadActiveOrders':
      'Could not load active orders',
    'menuTables.tables.couldNotLoadOrderHistory':
      'Could not load order history',
    'menuTables.tables.couldNotCreateTable': 'Could not create table',
    'menuTables.tables.tableNameEmpty': 'Table name cannot be empty.',
    'menuTables.tables.couldNotUpdateTable': 'Could not update table',
    'menuTables.tables.confirmDeleteTable':
      'Delete "{{label}}"? If it has order history, it will be deactivated instead.',
    'menuTables.tables.couldNotDeleteTable': 'Could not delete table',
    'menuTables.tables.couldNotCopyUrl': 'Could not copy the URL.',
    'menuTables.tables.loadingTables': 'Loading tables...',
    'menuTables.tables.restaurantFallback': 'Restaurant',
    'menuTables.tables.heading': 'Tables',
    'menuTables.tables.subheading':
      'Manage tables, QR/NFC links and see what is happening at each table.',
    'menuTables.tables.activeTotalSummary':
      '{{active}} active · {{total}} total',
    'menuTables.tables.live': 'Live',
    'menuTables.tables.offline': 'Offline',
    'menuTables.tables.addTable': 'Add table',
    'menuTables.tables.tableNamePlaceholder':
      'Table 7, Patio 2, Terrace 4...',
    'menuTables.tables.adding': 'Adding...',
    'menuTables.tables.noTablesYet': 'No tables yet',
    'menuTables.tables.addFirstTableAbove': 'Add your first table above.',
    'menuTables.tables.qrCodeAlt': 'QR code for {{label}}',
    'menuTables.tables.downloadQr': 'Download QR',
    'menuTables.tables.couldNotBuildQrCard': 'Could not generate the QR card',
    'menuTables.tables.qrCardEyebrow': 'Scan to order',
    'menuTables.tables.qrCardTableEyebrow': 'Table',
    'menuTables.tables.qrCardScanToOrder': 'Scan the code to view the menu and order',
    'menuTables.tables.copied': 'Copied!',
    'menuTables.tables.copyUrl': 'Copy URL',
    'menuTables.tables.openMenu': 'Open menu',
    'menuTables.tables.deactivate': 'Deactivate',
    'menuTables.tables.activate': 'Activate',
    'menuTables.tables.deleteTable': 'Delete table',
    'menuTables.tables.currentActivity': 'Current activity',
    'menuTables.tables.noActiveOrder': 'No active order',
    'menuTables.tables.activeOrdersCountSingular': '{{count}} active order',
    'menuTables.tables.activeOrdersCountPlural': '{{count}} active orders',
    'menuTables.tables.orderNumber': 'Order #{{number}}',
    'menuTables.tables.itemFallback': 'Item',
    'menuTables.tables.currentOrderLabel': 'Current order',
    'menuTables.tables.totalSpent': 'Total spent',
    'menuTables.tables.completedOrders': 'Completed orders',
    'menuTables.tables.orderProgress': 'Order progress',
    'menuTables.tables.qrNfcHeading': 'QR & NFC',
    'menuTables.tables.qrNfcParagraph1':
      'Each table has its own unique customer URL. The QR code and NFC tag should use exactly the same URL.',
    'menuTables.tables.qrNfcParagraph2':
      'Use "{{copyUrl}}" to program an NFC sticker, or "{{downloadQr}}" to print the table QR code.',
    'menuTables.tables.qrNfcParagraph3':
      'This page also shows the current order, order stage and completed spending for every table.',
  },
  pt: {
    // menu/poster/page.tsx
    'menuTables.poster.title': 'Colocar pratos na foto',
    'menuTables.poster.subtitle':
      'Arraste cada prato para o lugar certo na sua foto. O que não for colocado aparece na lista normal abaixo.',
    'menuTables.poster.loading': 'A carregar…',
    'menuTables.poster.noBackground':
      'Ainda não tens uma foto de fundo. Importa uma em "Importar de fotos" ou carrega uma nas Definições.',
    'menuTables.poster.couldNotLoad': 'Não foi possível carregar.',
    'menuTables.poster.couldNotSave': 'Não foi possível guardar a posição.',
    'menuTables.poster.unplacedHeading': 'Pratos por colocar',
    'menuTables.poster.allPlaced': 'Colocaste todos os pratos.',
    'menuTables.poster.place': 'Colocar',
    'menuTables.poster.remove': 'Remover',
    'menuTables.poster.dragHint': 'Arrasta as etiquetas na foto para ajustar a posição.',
    // menu/page.tsx
    'menuTables.editor.eyebrow': 'Menu do restaurante',
    'menuTables.editor.heading': 'Menu',
    'menuTables.editor.subheading':
      'Adicione pratos, atualize preços e controle a disponibilidade.',
    'menuTables.editor.importFromPhotos': 'Importar de fotos',
    'menuTables.editor.loadingMenu': 'A carregar o menu...',
    'menuTables.editor.couldNotLoadMenu': 'Não foi possível carregar o menu',
    'menuTables.editor.couldNotLoadRestaurant':
      'Não foi possível carregar o restaurante',
    'menuTables.editor.couldNotCreateCategory':
      'Não foi possível criar a categoria',
    'menuTables.editor.couldNotUpdateAvailability':
      'Não foi possível atualizar a disponibilidade',
    'menuTables.editor.couldNotDeleteItem':
      'Não foi possível eliminar o artigo',
    'menuTables.editor.couldNotCreateItem':
      'Não foi possível criar o artigo',
    'menuTables.editor.couldNotUpdateItem':
      'Não foi possível atualizar o artigo',
    'menuTables.editor.confirmDeleteItem':
      'Eliminar "{{name}}"? Se tiver histórico de pedidos, será marcado como indisponível em vez disso.',
    'menuTables.editor.itemSingular': 'artigo',
    'menuTables.editor.itemPlural': 'artigos',
    'menuTables.editor.addItem': 'Adicionar artigo',
    'menuTables.editor.noItemsYet': 'Ainda não há artigos nesta categoria.',
    'menuTables.editor.available': 'Disponível',
    'menuTables.editor.unavailable': 'Indisponível',
    'menuTables.editor.markUnavailable': 'Marcar como indisponível',
    'menuTables.editor.markAvailable': 'Marcar como disponível',
    'menuTables.editor.addCategory': 'Adicionar categoria',
    'menuTables.editor.categoryKindLabel': 'Tipo',
    'menuTables.editor.categoryKindFood': 'Comida',
    'menuTables.editor.categoryKindDrinks': 'Bebidas',
    'menuTables.editor.categoryKindDessert': 'Sobremesas',
    'menuTables.editor.categoryKindDrinksHint': 'Não precisa de preparo — a cozinha pode enviar direto ao garçom.',
    'menuTables.editor.couldNotUpdateCategoryKind': 'Não foi possível atualizar o tipo da categoria',
    'menuTables.editor.categoryNamePlaceholder':
      'Ex.: Entradas, Massas, Sobremesas',
    'menuTables.editor.enterItemName': 'Introduza o nome do artigo.',
    'menuTables.editor.enterValidPrice': 'Introduza um preço válido.',
    'menuTables.editor.enterValidVatRate':
      'Introduza uma taxa de IVA válida (0-100%).',
    'menuTables.editor.vatRateLabel': 'IVA',
    'menuTables.editor.vatRateCustomOption': 'Personalizado…',
    'menuTables.editor.vatRateCustomPlaceholder': '% personalizada',
    'menuTables.editor.vatBadge': 'IVA {{rate}}%',
    'menuTables.editor.allergensLabel': 'Alergénios',
    'menuTables.editor.dietaryTagsLabel': 'Etiquetas dietéticas',
    'menuTables.editor.invalidImageUrl': 'O URL da imagem tem de ser válido.',
    'menuTables.editor.dishNamePlaceholder': 'Nome do prato',
    'menuTables.editor.pricePlaceholder': 'Preço ({{currency}})',
    'menuTables.editor.shortDescriptionPlaceholder': 'Descrição breve',
    'menuTables.editor.imageUrlOptionalPlaceholder':
      'URL da imagem (opcional)',
    'menuTables.editor.saveItem': 'Guardar artigo',
    'menuTables.editor.descriptionPlaceholder': 'Descrição',
    'menuTables.editor.imageUrlPlaceholder': 'URL da imagem',
    'menuTables.editor.saveChanges': 'Guardar alterações',

    // menu/import/page.tsx
    'menuTables.import.subheading':
      'Tire algumas fotos nítidas do seu menu atual em papel ou PDF. A IA vai lê-las e criar o rascunho do seu menu online — revê e edita tudo antes de publicar.',
    'menuTables.import.couldNotReadFile': 'Não foi possível ler {{name}}',
    'menuTables.import.couldNotDecodeFile':
      'Não foi possível descodificar {{name}}',
    'menuTables.import.canvasNotSupported':
      'Este navegador não suporta canvas.',
    'menuTables.import.couldNotReadPhotos':
      'Não foi possível ler as fotos selecionadas.',
    'menuTables.import.chooseAtLeastOnePhoto':
      'Escolha pelo menos uma foto do menu primeiro.',
    'menuTables.import.couldNotAnalyzePhotos':
      'Não foi possível analisar as fotos do menu.',
    'menuTables.import.noItemsFound':
      'A IA não encontrou nenhum artigo de menu nestas fotos. Experimente fotos mais nítidas e bem iluminadas do menu completo.',
    'menuTables.import.couldNotPublishMenu':
      'Não foi possível publicar o menu.',
    'menuTables.import.photosSelected':
      '{{count}} foto(s) selecionada(s) — toque para alterar',
    'menuTables.import.tapToChoosePhotos':
      'Toque para escolher fotos do menu',
    'menuTables.import.menuPhotoAlt': 'Foto do menu {{number}}',
    'menuTables.import.readingWithAi': 'A ler o seu menu com IA...',
    'menuTables.import.analyzeWithAi': 'Analisar com IA',
    'menuTables.import.reviewSubheading':
      'Reveja o que a IA encontrou. Corrija o que estiver errado, remova o que não quiser e publique. Isto é adicionado ao seu menu existente — nada é eliminado.',
    'menuTables.import.removeCategory': 'Remover categoria',
    'menuTables.import.itemNamePlaceholder': 'Nome do artigo',
    'menuTables.import.descriptionOptionalPlaceholder':
      'Descrição (opcional)',
    'menuTables.import.pricePlaceholderZero': '0.00',
    'menuTables.import.noItemsInCategory': 'Não há artigos nesta categoria.',
    'menuTables.import.publishing': 'A publicar...',
    'menuTables.import.publishMenu': 'Publicar menu',
    'menuTables.import.brandingHeading': 'Estética sugerida',
    'menuTables.import.applyBranding': 'Aplicar ao meu restaurante',
    'menuTables.import.brandingFontSample': 'O Seu Restaurante',
    'menuTables.import.brandingHint':
      'A IA sugeriu esta estética a partir das fotos. Desmarque a caixa para não aplicar, ou altere mais tarde em Definições.',
    'menuTables.import.backgroundHeading': 'Fundo do menu',
    'menuTables.import.applyBackground': 'Usar como fundo do meu menu',
    'menuTables.import.backgroundPreviewSample': 'Assim ficaria',
    'menuTables.import.backgroundHint':
      'É a sua própria foto, desfocada e suavizada para o texto continuar legível — nada na foto original é apagado ou movido. Pode alterá-la mais tarde em Definições.',
    'menuTables.import.summaryDetected': '{{count}} artigos detetados.',
    'menuTables.import.summaryReady': '{{count}} artigos prontos.',
    'menuTables.import.summaryNeedsAttention': '{{count}} precisam da sua atenção.',
    'menuTables.import.jumpToNext': 'Ver seguinte',
    'menuTables.import.issueMissingPrice': 'REVER PREÇO',
    'menuTables.import.issueDuplicateName': 'Nome duplicado nesta categoria',
    'menuTables.import.issueEmptyCategory': 'Esta categoria não tem artigos',
    'menuTables.import.issueUncertainCategory': 'A IA não tem a certeza sobre esta categoria',
    'menuTables.import.issueLowConfidence': 'A IA não tem a certeza sobre este artigo',
    'menuTables.import.needsReviewReason': 'A IA não tem a certeza absoluta — verifique',
    'menuTables.import.uncertainField.name': 'Nome a confirmar',
    'menuTables.import.uncertainField.description': 'Descrição a confirmar',
    'menuTables.import.uncertainField.price': 'Preço a confirmar',
    'menuTables.import.uncertainField.allergens': 'Alergénios a confirmar',
    'menuTables.import.uncertainField.dietaryTags': 'Etiquetas dietéticas a confirmar',
    'menuTables.import.uncertainField.modifiers': 'Modificadores a confirmar',
    'menuTables.import.fixIssuesBeforePublishing':
      'Corrija os avisos assinalados antes de publicar.',
    'menuTables.import.modifierSingle': 'Escolha um',
    'menuTables.import.modifierMultiple': 'Escolha vários',

    // tables/page.tsx
    'menuTables.tables.justNow': 'agora mesmo',
    'menuTables.tables.oneMinAgo': 'há 1 min',
    'menuTables.tables.minsAgo': 'há {{minutes}} min',
    'menuTables.tables.statusNew': 'Novo',
    'menuTables.tables.statusAccepted': 'Aceite',
    'menuTables.tables.statusPreparing': 'Em preparação',
    'menuTables.tables.statusReady': 'Pronto',
    'menuTables.tables.statusCompleted': 'Concluído',
    'menuTables.tables.statusServed': 'Servido',
    'menuTables.tables.couldNotLoadTables':
      'Não foi possível carregar as mesas',
    'menuTables.tables.couldNotLoadActiveOrders':
      'Não foi possível carregar os pedidos ativos',
    'menuTables.tables.couldNotLoadOrderHistory':
      'Não foi possível carregar o histórico de pedidos',
    'menuTables.tables.couldNotCreateTable':
      'Não foi possível criar a mesa',
    'menuTables.tables.tableNameEmpty':
      'O nome da mesa não pode estar vazio.',
    'menuTables.tables.couldNotUpdateTable':
      'Não foi possível atualizar a mesa',
    'menuTables.tables.confirmDeleteTable':
      'Eliminar "{{label}}"? Se tiver histórico de pedidos, será desativada em vez disso.',
    'menuTables.tables.couldNotDeleteTable':
      'Não foi possível eliminar a mesa',
    'menuTables.tables.couldNotCopyUrl': 'Não foi possível copiar o URL.',
    'menuTables.tables.loadingTables': 'A carregar mesas...',
    'menuTables.tables.restaurantFallback': 'Restaurante',
    'menuTables.tables.heading': 'Mesas',
    'menuTables.tables.subheading':
      'Faça a gestão das mesas, dos links QR/NFC e veja o que está a acontecer em cada mesa.',
    'menuTables.tables.activeTotalSummary':
      '{{active}} ativas · {{total}} no total',
    'menuTables.tables.live': 'Ao vivo',
    'menuTables.tables.offline': 'Offline',
    'menuTables.tables.addTable': 'Adicionar mesa',
    'menuTables.tables.tableNamePlaceholder':
      'Mesa 7, Esplanada 2, Pátio 4...',
    'menuTables.tables.adding': 'A adicionar...',
    'menuTables.tables.noTablesYet': 'Ainda não há mesas',
    'menuTables.tables.addFirstTableAbove':
      'Adicione a sua primeira mesa acima.',
    'menuTables.tables.qrCodeAlt': 'Código QR de {{label}}',
    'menuTables.tables.downloadQr': 'Transferir QR',
    'menuTables.tables.couldNotBuildQrCard': 'Não foi possível gerar o cartão QR',
    'menuTables.tables.qrCardEyebrow': 'Digitalize para pedir',
    'menuTables.tables.qrCardTableEyebrow': 'Mesa',
    'menuTables.tables.qrCardScanToOrder': 'Digitalize o código para ver o menu e pedir',
    'menuTables.tables.copied': 'Copiado!',
    'menuTables.tables.copyUrl': 'Copiar URL',
    'menuTables.tables.openMenu': 'Abrir menu',
    'menuTables.tables.deactivate': 'Desativar',
    'menuTables.tables.activate': 'Ativar',
    'menuTables.tables.deleteTable': 'Eliminar mesa',
    'menuTables.tables.currentActivity': 'Atividade atual',
    'menuTables.tables.noActiveOrder': 'Sem pedido ativo',
    'menuTables.tables.activeOrdersCountSingular': '{{count}} pedido ativo',
    'menuTables.tables.activeOrdersCountPlural': '{{count}} pedidos ativos',
    'menuTables.tables.orderNumber': 'Pedido n.º {{number}}',
    'menuTables.tables.itemFallback': 'Artigo',
    'menuTables.tables.currentOrderLabel': 'Pedido atual',
    'menuTables.tables.totalSpent': 'Total gasto',
    'menuTables.tables.completedOrders': 'Pedidos concluídos',
    'menuTables.tables.orderProgress': 'Progresso do pedido',
    'menuTables.tables.qrNfcHeading': 'QR e NFC',
    'menuTables.tables.qrNfcParagraph1':
      'Cada mesa tem o seu próprio URL de cliente único. O código QR e a etiqueta NFC devem usar exatamente o mesmo URL.',
    'menuTables.tables.qrNfcParagraph2':
      'Use "{{copyUrl}}" para programar um autocolante NFC, ou "{{downloadQr}}" para imprimir o código QR da mesa.',
    'menuTables.tables.qrNfcParagraph3':
      'Esta página também mostra o pedido atual, a fase do pedido e o gasto concluído de cada mesa.',
  },
  de: {
    // menu/poster/page.tsx
    'menuTables.poster.title': 'Gerichte auf dem Foto platzieren',
    'menuTables.poster.subtitle':
      'Ziehe jedes Gericht an seinen Platz auf deinem Foto. Nicht platzierte Gerichte erscheinen in der normalen Liste darunter.',
    'menuTables.poster.loading': 'Wird geladen…',
    'menuTables.poster.noBackground':
      'Du hast noch kein Hintergrundfoto. Importiere eins über "Aus Fotos importieren" oder lade eins in den Einstellungen hoch.',
    'menuTables.poster.couldNotLoad': 'Konnte nicht geladen werden.',
    'menuTables.poster.couldNotSave': 'Position konnte nicht gespeichert werden.',
    'menuTables.poster.unplacedHeading': 'Nicht platzierte Gerichte',
    'menuTables.poster.allPlaced': 'Du hast alle Gerichte platziert.',
    'menuTables.poster.place': 'Platzieren',
    'menuTables.poster.remove': 'Entfernen',
    'menuTables.poster.dragHint': 'Ziehe die Beschriftungen auf dem Foto, um ihre Position anzupassen.',
    // menu/page.tsx
    'menuTables.editor.eyebrow': 'Restaurantmenü',
    'menuTables.editor.heading': 'Speisekarte',
    'menuTables.editor.subheading':
      'Gerichte hinzufügen, Preise aktualisieren und Verfügbarkeit steuern.',
    'menuTables.editor.importFromPhotos': 'Aus Fotos importieren',
    'menuTables.editor.loadingMenu': 'Speisekarte wird geladen...',
    'menuTables.editor.couldNotLoadMenu':
      'Speisekarte konnte nicht geladen werden',
    'menuTables.editor.couldNotLoadRestaurant':
      'Restaurant konnte nicht geladen werden',
    'menuTables.editor.couldNotCreateCategory':
      'Kategorie konnte nicht erstellt werden',
    'menuTables.editor.couldNotUpdateAvailability':
      'Verfügbarkeit konnte nicht aktualisiert werden',
    'menuTables.editor.couldNotDeleteItem':
      'Artikel konnte nicht gelöscht werden',
    'menuTables.editor.couldNotCreateItem':
      'Artikel konnte nicht erstellt werden',
    'menuTables.editor.couldNotUpdateItem':
      'Artikel konnte nicht aktualisiert werden',
    'menuTables.editor.confirmDeleteItem':
      '"{{name}}" löschen? Falls eine Bestellhistorie vorhanden ist, wird der Artikel stattdessen als nicht verfügbar markiert.',
    'menuTables.editor.itemSingular': 'Artikel',
    'menuTables.editor.itemPlural': 'Artikel',
    'menuTables.editor.addItem': 'Artikel hinzufügen',
    'menuTables.editor.noItemsYet': 'Noch keine Artikel in dieser Kategorie.',
    'menuTables.editor.available': 'Verfügbar',
    'menuTables.editor.unavailable': 'Nicht verfügbar',
    'menuTables.editor.markUnavailable': 'Als nicht verfügbar markieren',
    'menuTables.editor.markAvailable': 'Als verfügbar markieren',
    'menuTables.editor.addCategory': 'Kategorie hinzufügen',
    'menuTables.editor.categoryKindLabel': 'Art',
    'menuTables.editor.categoryKindFood': 'Essen',
    'menuTables.editor.categoryKindDrinks': 'Getränke',
    'menuTables.editor.categoryKindDessert': 'Dessert',
    'menuTables.editor.categoryKindDrinksHint': 'Benötigt keine Zubereitung — die Küche kann es direkt an den Kellner senden.',
    'menuTables.editor.couldNotUpdateCategoryKind': 'Die Kategorieart konnte nicht aktualisiert werden',
    'menuTables.editor.categoryNamePlaceholder':
      'z. B. Vorspeisen, Pasta, Desserts',
    'menuTables.editor.enterItemName': 'Gib einen Artikelnamen ein.',
    'menuTables.editor.enterValidPrice': 'Gib einen gültigen Preis ein.',
    'menuTables.editor.enterValidVatRate':
      'Gib einen gültigen Mehrwertsteuersatz ein (0-100%).',
    'menuTables.editor.vatRateLabel': 'MwSt.',
    'menuTables.editor.vatRateCustomOption': 'Benutzerdefiniert…',
    'menuTables.editor.vatRateCustomPlaceholder': 'Benutzerdefiniert %',
    'menuTables.editor.vatBadge': 'MwSt. {{rate}}%',
    'menuTables.editor.allergensLabel': 'Allergene',
    'menuTables.editor.dietaryTagsLabel': 'Ernährungshinweise',
    'menuTables.editor.invalidImageUrl': 'Die Bild-URL muss gültig sein.',
    'menuTables.editor.dishNamePlaceholder': 'Gerichtname',
    'menuTables.editor.pricePlaceholder': 'Preis ({{currency}})',
    'menuTables.editor.shortDescriptionPlaceholder': 'Kurzbeschreibung',
    'menuTables.editor.imageUrlOptionalPlaceholder': 'Bild-URL (optional)',
    'menuTables.editor.saveItem': 'Artikel speichern',
    'menuTables.editor.descriptionPlaceholder': 'Beschreibung',
    'menuTables.editor.imageUrlPlaceholder': 'Bild-URL',
    'menuTables.editor.saveChanges': 'Änderungen speichern',

    // menu/import/page.tsx
    'menuTables.import.subheading':
      'Mache ein paar klare Fotos deiner bestehenden Papier- oder PDF-Speisekarte. Die KI liest sie ein und erstellt einen Entwurf deiner Online-Speisekarte — du prüfst und bearbeitest alles, bevor es veröffentlicht wird.',
    'menuTables.import.couldNotReadFile':
      '{{name}} konnte nicht gelesen werden',
    'menuTables.import.couldNotDecodeFile':
      '{{name}} konnte nicht decodiert werden',
    'menuTables.import.canvasNotSupported':
      'Canvas wird von diesem Browser nicht unterstützt.',
    'menuTables.import.couldNotReadPhotos':
      'Die ausgewählten Fotos konnten nicht gelesen werden.',
    'menuTables.import.chooseAtLeastOnePhoto':
      'Wähle zuerst mindestens ein Foto der Speisekarte aus.',
    'menuTables.import.couldNotAnalyzePhotos':
      'Die Menüfotos konnten nicht analysiert werden.',
    'menuTables.import.noItemsFound':
      'Die KI konnte auf diesen Fotos keine Menüpunkte finden. Versuche es mit schärferen, gut beleuchteten Fotos der gesamten Speisekarte.',
    'menuTables.import.couldNotPublishMenu':
      'Die Speisekarte konnte nicht veröffentlicht werden.',
    'menuTables.import.photosSelected':
      '{{count}} Foto(s) ausgewählt — zum Ändern tippen',
    'menuTables.import.tapToChoosePhotos':
      'Zum Auswählen von Menüfotos tippen',
    'menuTables.import.menuPhotoAlt': 'Menüfoto {{number}}',
    'menuTables.import.readingWithAi': 'Deine Speisekarte wird mit KI gelesen...',
    'menuTables.import.analyzeWithAi': 'Mit KI analysieren',
    'menuTables.import.reviewSubheading':
      'Überprüfe, was die KI gefunden hat. Korrigiere Fehler, entferne, was du nicht möchtest, und veröffentliche dann. Dies wird zu deiner bestehenden Speisekarte hinzugefügt — nichts wird gelöscht.',
    'menuTables.import.removeCategory': 'Kategorie entfernen',
    'menuTables.import.itemNamePlaceholder': 'Artikelname',
    'menuTables.import.descriptionOptionalPlaceholder':
      'Beschreibung (optional)',
    'menuTables.import.pricePlaceholderZero': '0.00',
    'menuTables.import.noItemsInCategory': 'Keine Artikel in dieser Kategorie.',
    'menuTables.import.publishing': 'Wird veröffentlicht...',
    'menuTables.import.publishMenu': 'Speisekarte veröffentlichen',
    'menuTables.import.brandingHeading': 'Vorgeschlagenes Erscheinungsbild',
    'menuTables.import.applyBranding': 'Auf mein Restaurant anwenden',
    'menuTables.import.brandingFontSample': 'Dein Restaurant',
    'menuTables.import.brandingHint':
      'Die KI hat dieses Erscheinungsbild anhand der Fotos vorgeschlagen. Entferne das Häkchen, um es nicht zu übernehmen, oder ändere es später in den Einstellungen.',
    'menuTables.import.backgroundHeading': 'Menühintergrund',
    'menuTables.import.applyBackground': 'Als Hintergrund meiner Speisekarte verwenden',
    'menuTables.import.backgroundPreviewSample': 'So würde es aussehen',
    'menuTables.import.backgroundHint':
      'Es ist dein eigenes Foto, weichgezeichnet und abgedunkelt, damit der Text lesbar bleibt — im Originalfoto wird nichts gelöscht oder verschoben. Du kannst es später in den Einstellungen ändern.',
    'menuTables.import.summaryDetected': '{{count}} Artikel erkannt.',
    'menuTables.import.summaryReady': '{{count}} Artikel sind bereit.',
    'menuTables.import.summaryNeedsAttention': '{{count}} benötigen deine Aufmerksamkeit.',
    'menuTables.import.jumpToNext': 'Nächsten anzeigen',
    'menuTables.import.issueMissingPrice': 'PREIS PRÜFEN',
    'menuTables.import.issueDuplicateName': 'Doppelter Name in dieser Kategorie',
    'menuTables.import.issueEmptyCategory': 'Diese Kategorie hat keine Artikel',
    'menuTables.import.issueUncertainCategory': 'Die KI ist sich bei dieser Kategorie nicht sicher',
    'menuTables.import.issueLowConfidence': 'Die KI ist sich bei diesem Artikel nicht sicher',
    'menuTables.import.needsReviewReason': 'Die KI ist sich nicht ganz sicher — bitte prüfen',
    'menuTables.import.uncertainField.name': 'Name zu bestätigen',
    'menuTables.import.uncertainField.description': 'Beschreibung zu bestätigen',
    'menuTables.import.uncertainField.price': 'Preis zu bestätigen',
    'menuTables.import.uncertainField.allergens': 'Allergene zu bestätigen',
    'menuTables.import.uncertainField.dietaryTags': 'Ernährungshinweise zu bestätigen',
    'menuTables.import.uncertainField.modifiers': 'Zusatzoptionen zu bestätigen',
    'menuTables.import.fixIssuesBeforePublishing':
      'Behebe die markierten Probleme vor der Veröffentlichung.',
    'menuTables.import.modifierSingle': 'Eine Wahl',
    'menuTables.import.modifierMultiple': 'Mehrfachauswahl',

    // tables/page.tsx
    'menuTables.tables.justNow': 'gerade eben',
    'menuTables.tables.oneMinAgo': 'vor 1 Min.',
    'menuTables.tables.minsAgo': 'vor {{minutes}} Min.',
    'menuTables.tables.statusNew': 'Neu',
    'menuTables.tables.statusAccepted': 'Angenommen',
    'menuTables.tables.statusPreparing': 'In Zubereitung',
    'menuTables.tables.statusReady': 'Bereit',
    'menuTables.tables.statusCompleted': 'Abgeschlossen',
    'menuTables.tables.statusServed': 'Serviert',
    'menuTables.tables.couldNotLoadTables':
      'Tische konnten nicht geladen werden',
    'menuTables.tables.couldNotLoadActiveOrders':
      'Aktive Bestellungen konnten nicht geladen werden',
    'menuTables.tables.couldNotLoadOrderHistory':
      'Bestellverlauf konnte nicht geladen werden',
    'menuTables.tables.couldNotCreateTable':
      'Tisch konnte nicht erstellt werden',
    'menuTables.tables.tableNameEmpty': 'Der Tischname darf nicht leer sein.',
    'menuTables.tables.couldNotUpdateTable':
      'Tisch konnte nicht aktualisiert werden',
    'menuTables.tables.confirmDeleteTable':
      '"{{label}}" löschen? Falls eine Bestellhistorie vorhanden ist, wird der Tisch stattdessen deaktiviert.',
    'menuTables.tables.couldNotDeleteTable':
      'Tisch konnte nicht gelöscht werden',
    'menuTables.tables.couldNotCopyUrl': 'Die URL konnte nicht kopiert werden.',
    'menuTables.tables.loadingTables': 'Tische werden geladen...',
    'menuTables.tables.restaurantFallback': 'Restaurant',
    'menuTables.tables.heading': 'Tische',
    'menuTables.tables.subheading':
      'Verwalte Tische und QR-/NFC-Links und sieh, was an jedem Tisch passiert.',
    'menuTables.tables.activeTotalSummary':
      '{{active}} aktiv · {{total}} insgesamt',
    'menuTables.tables.live': 'Live',
    'menuTables.tables.offline': 'Offline',
    'menuTables.tables.addTable': 'Tisch hinzufügen',
    'menuTables.tables.tableNamePlaceholder':
      'Tisch 7, Terrasse 2, Patio 4...',
    'menuTables.tables.adding': 'Wird hinzugefügt...',
    'menuTables.tables.noTablesYet': 'Noch keine Tische',
    'menuTables.tables.addFirstTableAbove':
      'Füge oben deinen ersten Tisch hinzu.',
    'menuTables.tables.qrCodeAlt': 'QR-Code für {{label}}',
    'menuTables.tables.downloadQr': 'QR-Code herunterladen',
    'menuTables.tables.couldNotBuildQrCard': 'QR-Karte konnte nicht erstellt werden',
    'menuTables.tables.qrCardEyebrow': 'Scannen zum Bestellen',
    'menuTables.tables.qrCardTableEyebrow': 'Tisch',
    'menuTables.tables.qrCardScanToOrder': 'Scanne den Code, um die Speisekarte zu sehen und zu bestellen',
    'menuTables.tables.copied': 'Kopiert!',
    'menuTables.tables.copyUrl': 'URL kopieren',
    'menuTables.tables.openMenu': 'Speisekarte öffnen',
    'menuTables.tables.deactivate': 'Deaktivieren',
    'menuTables.tables.activate': 'Aktivieren',
    'menuTables.tables.deleteTable': 'Tisch löschen',
    'menuTables.tables.currentActivity': 'Aktuelle Aktivität',
    'menuTables.tables.noActiveOrder': 'Keine aktive Bestellung',
    'menuTables.tables.activeOrdersCountSingular':
      '{{count}} aktive Bestellung',
    'menuTables.tables.activeOrdersCountPlural':
      '{{count}} aktive Bestellungen',
    'menuTables.tables.orderNumber': 'Bestellung Nr. {{number}}',
    'menuTables.tables.itemFallback': 'Artikel',
    'menuTables.tables.currentOrderLabel': 'Aktuelle Bestellung',
    'menuTables.tables.totalSpent': 'Gesamtausgaben',
    'menuTables.tables.completedOrders': 'Abgeschlossene Bestellungen',
    'menuTables.tables.orderProgress': 'Bestellfortschritt',
    'menuTables.tables.qrNfcHeading': 'QR & NFC',
    'menuTables.tables.qrNfcParagraph1':
      'Jeder Tisch hat seine eigene eindeutige Kunden-URL. Der QR-Code und das NFC-Tag sollten genau dieselbe URL verwenden.',
    'menuTables.tables.qrNfcParagraph2':
      'Verwende „{{copyUrl}}“, um einen NFC-Aufkleber zu programmieren, oder „{{downloadQr}}“, um den QR-Code des Tisches zu drucken.',
    'menuTables.tables.qrNfcParagraph3':
      'Diese Seite zeigt außerdem die aktuelle Bestellung, den Bestellstatus und die abgeschlossenen Ausgaben für jeden Tisch.',
  },
  fr: {
    // menu/poster/page.tsx
    'menuTables.poster.title': 'Placer les plats sur la photo',
    'menuTables.poster.subtitle':
      'Faites glisser chaque plat à sa place sur votre photo. Ceux que vous ne placez pas apparaissent dans la liste normale ci-dessous.',
    'menuTables.poster.loading': 'Chargement…',
    'menuTables.poster.noBackground':
      'Vous n\'avez pas encore de photo de fond. Importez-en une depuis "Importer depuis des photos" ou téléchargez-en une dans les Paramètres.',
    'menuTables.poster.couldNotLoad': 'Impossible de charger.',
    'menuTables.poster.couldNotSave': 'Impossible d\'enregistrer la position.',
    'menuTables.poster.unplacedHeading': 'Plats non placés',
    'menuTables.poster.allPlaced': 'Vous avez placé tous les plats.',
    'menuTables.poster.place': 'Placer',
    'menuTables.poster.remove': 'Retirer',
    'menuTables.poster.dragHint': 'Faites glisser les étiquettes sur la photo pour ajuster leur position.',
    // menu/page.tsx
    'menuTables.editor.eyebrow': 'Menu du restaurant',
    'menuTables.editor.heading': 'Menu',
    'menuTables.editor.subheading':
      'Ajoutez des plats, mettez à jour les prix et gérez la disponibilité.',
    'menuTables.editor.importFromPhotos': 'Importer depuis des photos',
    'menuTables.editor.loadingMenu': 'Chargement du menu...',
    'menuTables.editor.couldNotLoadMenu': 'Impossible de charger le menu',
    'menuTables.editor.couldNotLoadRestaurant':
      'Impossible de charger le restaurant',
    'menuTables.editor.couldNotCreateCategory':
      'Impossible de créer la catégorie',
    'menuTables.editor.couldNotUpdateAvailability':
      'Impossible de mettre à jour la disponibilité',
    'menuTables.editor.couldNotDeleteItem':
      "Impossible de supprimer l'article",
    'menuTables.editor.couldNotCreateItem': "Impossible de créer l'article",
    'menuTables.editor.couldNotUpdateItem':
      "Impossible de mettre à jour l'article",
    'menuTables.editor.confirmDeleteItem':
      'Supprimer "{{name}}" ? S\'il a un historique de commandes, il sera marqué comme indisponible à la place.',
    'menuTables.editor.itemSingular': 'article',
    'menuTables.editor.itemPlural': 'articles',
    'menuTables.editor.addItem': 'Ajouter un article',
    'menuTables.editor.noItemsYet':
      "Aucun article dans cette catégorie pour l'instant.",
    'menuTables.editor.available': 'Disponible',
    'menuTables.editor.unavailable': 'Indisponible',
    'menuTables.editor.markUnavailable': 'Marquer comme indisponible',
    'menuTables.editor.markAvailable': 'Marquer comme disponible',
    'menuTables.editor.addCategory': 'Ajouter une catégorie',
    'menuTables.editor.categoryKindLabel': 'Type',
    'menuTables.editor.categoryKindFood': 'Plats',
    'menuTables.editor.categoryKindDrinks': 'Boissons',
    'menuTables.editor.categoryKindDessert': 'Desserts',
    'menuTables.editor.categoryKindDrinksHint': "Ne nécessite aucune préparation — la cuisine peut l'envoyer directement au serveur.",
    'menuTables.editor.couldNotUpdateCategoryKind': 'Impossible de mettre à jour le type de catégorie',
    'menuTables.editor.categoryNamePlaceholder':
      'Ex. Entrées, Pâtes, Desserts',
    'menuTables.editor.enterItemName': "Saisissez un nom d'article.",
    'menuTables.editor.enterValidPrice': 'Saisissez un prix valide.',
    'menuTables.editor.enterValidVatRate':
      'Saisissez un taux de TVA valide (0-100%).',
    'menuTables.editor.vatRateLabel': 'TVA',
    'menuTables.editor.vatRateCustomOption': 'Personnalisé…',
    'menuTables.editor.vatRateCustomPlaceholder': '% personnalisé',
    'menuTables.editor.vatBadge': 'TVA {{rate}}%',
    'menuTables.editor.allergensLabel': 'Allergènes',
    'menuTables.editor.dietaryTagsLabel': 'Étiquettes diététiques',
    'menuTables.editor.invalidImageUrl':
      "L'URL de l'image doit être valide.",
    'menuTables.editor.dishNamePlaceholder': 'Nom du plat',
    'menuTables.editor.pricePlaceholder': 'Prix ({{currency}})',
    'menuTables.editor.shortDescriptionPlaceholder': 'Description courte',
    'menuTables.editor.imageUrlOptionalPlaceholder':
      "URL de l'image (facultatif)",
    'menuTables.editor.saveItem': "Enregistrer l'article",
    'menuTables.editor.descriptionPlaceholder': 'Description',
    'menuTables.editor.imageUrlPlaceholder': "URL de l'image",
    'menuTables.editor.saveChanges': 'Enregistrer les modifications',

    // menu/import/page.tsx
    'menuTables.import.subheading':
      "Prenez quelques photos nettes de votre menu papier ou PDF actuel. L'IA les lira et créera un brouillon de votre menu en ligne — vous vérifiez et modifiez tout avant sa publication.",
    'menuTables.import.couldNotReadFile': 'Impossible de lire {{name}}',
    'menuTables.import.couldNotDecodeFile': 'Impossible de décoder {{name}}',
    'menuTables.import.canvasNotSupported':
      'Canvas non pris en charge par ce navigateur.',
    'menuTables.import.couldNotReadPhotos':
      'Impossible de lire les photos sélectionnées.',
    'menuTables.import.chooseAtLeastOnePhoto':
      "Choisissez d'abord au moins une photo du menu.",
    'menuTables.import.couldNotAnalyzePhotos':
      "Impossible d'analyser les photos du menu.",
    'menuTables.import.noItemsFound':
      "L'IA n'a trouvé aucun article de menu sur ces photos. Essayez des photos plus nettes et bien éclairées de tout le menu.",
    'menuTables.import.couldNotPublishMenu': 'Impossible de publier le menu.',
    'menuTables.import.photosSelected':
      '{{count}} photo(s) sélectionnée(s) — touchez pour changer',
    'menuTables.import.tapToChoosePhotos':
      'Touchez pour choisir des photos du menu',
    'menuTables.import.menuPhotoAlt': 'Photo du menu {{number}}',
    'menuTables.import.readingWithAi': "Lecture de votre menu par l'IA...",
    'menuTables.import.analyzeWithAi': "Analyser avec l'IA",
    'menuTables.import.reviewSubheading':
      "Vérifiez ce que l'IA a trouvé. Corrigez ce qui ne va pas, supprimez ce que vous ne voulez pas, puis publiez. Ceci est ajouté à votre menu existant — rien n'est supprimé.",
    'menuTables.import.removeCategory': 'Supprimer la catégorie',
    'menuTables.import.itemNamePlaceholder': "Nom de l'article",
    'menuTables.import.descriptionOptionalPlaceholder':
      'Description (facultatif)',
    'menuTables.import.pricePlaceholderZero': '0.00',
    'menuTables.import.noItemsInCategory': 'Aucun article dans cette catégorie.',
    'menuTables.import.publishing': 'Publication...',
    'menuTables.import.publishMenu': 'Publier le menu',
    'menuTables.import.brandingHeading': 'Esthétique suggérée',
    'menuTables.import.applyBranding': 'Appliquer à mon restaurant',
    'menuTables.import.brandingFontSample': 'Votre Restaurant',
    'menuTables.import.brandingHint':
      "L'IA a suggéré cette esthétique à partir des photos. Décochez la case pour ne pas l'appliquer, ou changez-la plus tard dans les Paramètres.",
    'menuTables.import.backgroundHeading': 'Arrière-plan du menu',
    'menuTables.import.applyBackground': "Utiliser comme arrière-plan de mon menu",
    'menuTables.import.backgroundPreviewSample': 'Voici à quoi ça ressemblerait',
    'menuTables.import.backgroundHint':
      "C'est votre propre photo, floutée et assombrie pour que le texte reste lisible — rien n'est effacé ni déplacé dans la photo originale. Vous pourrez la changer plus tard dans les Paramètres.",
    'menuTables.import.summaryDetected': '{{count}} articles détectés.',
    'menuTables.import.summaryReady': '{{count}} articles sont prêts.',
    'menuTables.import.summaryNeedsAttention': '{{count}} nécessitent votre attention.',
    'menuTables.import.jumpToNext': 'Voir le suivant',
    'menuTables.import.issueMissingPrice': 'VÉRIFIER LE PRIX',
    'menuTables.import.issueDuplicateName': 'Nom en double dans cette catégorie',
    'menuTables.import.issueEmptyCategory': "Cette catégorie n'a aucun article",
    'menuTables.import.issueUncertainCategory': "L'IA n'est pas sûre de cette catégorie",
    'menuTables.import.issueLowConfidence': "L'IA n'est pas sûre de cet article",
    'menuTables.import.needsReviewReason': "L'IA n'est pas tout à fait sûre — merci de vérifier",
    'menuTables.import.uncertainField.name': 'Nom à confirmer',
    'menuTables.import.uncertainField.description': 'Description à confirmer',
    'menuTables.import.uncertainField.price': 'Prix à confirmer',
    'menuTables.import.uncertainField.allergens': 'Allergènes à confirmer',
    'menuTables.import.uncertainField.dietaryTags': 'Étiquettes diététiques à confirmer',
    'menuTables.import.uncertainField.modifiers': 'Modificateurs à confirmer',
    'menuTables.import.fixIssuesBeforePublishing':
      'Corrigez les problèmes signalés avant de publier.',
    'menuTables.import.modifierSingle': 'Choisir un',
    'menuTables.import.modifierMultiple': 'Choisir plusieurs',

    // tables/page.tsx
    'menuTables.tables.justNow': "à l'instant",
    'menuTables.tables.oneMinAgo': 'il y a 1 min',
    'menuTables.tables.minsAgo': 'il y a {{minutes}} min',
    'menuTables.tables.statusNew': 'Nouvelle',
    'menuTables.tables.statusAccepted': 'Acceptée',
    'menuTables.tables.statusPreparing': 'En préparation',
    'menuTables.tables.statusReady': 'Prête',
    'menuTables.tables.statusCompleted': 'Terminée',
    'menuTables.tables.statusServed': 'Servie',
    'menuTables.tables.couldNotLoadTables': 'Impossible de charger les tables',
    'menuTables.tables.couldNotLoadActiveOrders':
      'Impossible de charger les commandes actives',
    'menuTables.tables.couldNotLoadOrderHistory':
      "Impossible de charger l'historique des commandes",
    'menuTables.tables.couldNotCreateTable': 'Impossible de créer la table',
    'menuTables.tables.tableNameEmpty':
      'Le nom de la table ne peut pas être vide.',
    'menuTables.tables.couldNotUpdateTable':
      'Impossible de mettre à jour la table',
    'menuTables.tables.confirmDeleteTable':
      'Supprimer "{{label}}" ? Si elle a un historique de commandes, elle sera désactivée à la place.',
    'menuTables.tables.couldNotDeleteTable':
      'Impossible de supprimer la table',
    'menuTables.tables.couldNotCopyUrl': "Impossible de copier l'URL.",
    'menuTables.tables.loadingTables': 'Chargement des tables...',
    'menuTables.tables.restaurantFallback': 'Restaurant',
    'menuTables.tables.heading': 'Tables',
    'menuTables.tables.subheading':
      'Gérez les tables, les liens QR/NFC et suivez ce qui se passe à chaque table.',
    'menuTables.tables.activeTotalSummary':
      '{{active}} actives · {{total}} au total',
    'menuTables.tables.live': 'En direct',
    'menuTables.tables.offline': 'Hors ligne',
    'menuTables.tables.addTable': 'Ajouter une table',
    'menuTables.tables.tableNamePlaceholder':
      'Table 7, Terrasse 2, Patio 4...',
    'menuTables.tables.adding': 'Ajout en cours...',
    'menuTables.tables.noTablesYet': 'Aucune table pour le moment',
    'menuTables.tables.addFirstTableAbove':
      'Ajoutez votre première table ci-dessus.',
    'menuTables.tables.qrCodeAlt': 'Code QR pour {{label}}',
    'menuTables.tables.downloadQr': 'Télécharger le QR',
    'menuTables.tables.couldNotBuildQrCard': 'Impossible de générer la carte QR',
    'menuTables.tables.qrCardEyebrow': 'Scannez pour commander',
    'menuTables.tables.qrCardTableEyebrow': 'Table',
    'menuTables.tables.qrCardScanToOrder': 'Scannez le code pour voir le menu et commander',
    'menuTables.tables.copied': 'Copié !',
    'menuTables.tables.copyUrl': "Copier l'URL",
    'menuTables.tables.openMenu': 'Ouvrir le menu',
    'menuTables.tables.deactivate': 'Désactiver',
    'menuTables.tables.activate': 'Activer',
    'menuTables.tables.deleteTable': 'Supprimer la table',
    'menuTables.tables.currentActivity': 'Activité actuelle',
    'menuTables.tables.noActiveOrder': 'Aucune commande active',
    'menuTables.tables.activeOrdersCountSingular': '{{count}} commande active',
    'menuTables.tables.activeOrdersCountPlural':
      '{{count}} commandes actives',
    'menuTables.tables.orderNumber': 'Commande n° {{number}}',
    'menuTables.tables.itemFallback': 'Article',
    'menuTables.tables.currentOrderLabel': 'Commande en cours',
    'menuTables.tables.totalSpent': 'Total dépensé',
    'menuTables.tables.completedOrders': 'Commandes terminées',
    'menuTables.tables.orderProgress': 'Progression de la commande',
    'menuTables.tables.qrNfcHeading': 'QR & NFC',
    'menuTables.tables.qrNfcParagraph1':
      'Chaque table possède sa propre URL client unique. Le code QR et le tag NFC doivent utiliser exactement la même URL.',
    'menuTables.tables.qrNfcParagraph2':
      'Utilisez « {{copyUrl}} » pour programmer un autocollant NFC, ou « {{downloadQr}} » pour imprimer le code QR de la table.',
    'menuTables.tables.qrNfcParagraph3':
      "Cette page affiche également la commande en cours, l'étape de la commande et les dépenses terminées pour chaque table.",
  },
};
