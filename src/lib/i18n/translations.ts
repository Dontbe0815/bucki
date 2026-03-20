// Übersetzungsdateien für Deutsch und Englisch

export type Language = 'de' | 'en';

export interface TranslationStrings {
  // Navigation
  nav: {
    dashboard: string;
    properties: string;
    units: string;
    tenants: string;
    finances: string;
    financing: string;
    depreciation: string;
    housemoney: string;
    documents: string;
    tasks: string;
    reports: string;
    settings: string;
    calendar: string;
    more: string;
  };
  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    properties: string;
    coldRentIncome: string;
    assetGrowth: string;
    cashflow: string;
    currentDebt: string;
    totalExpenses: string;
    depreciation: string;
    estimatedValue: string;
    equity: string;
    warmRent: string;
    rentalRate: string;
    rented: string;
    vacant: string;
    marketValueIncrease: string;
    cashflowOverview: string;
    portfolioDistribution: string;
    depreciationByCategory: string;
    monthlyDepreciation: string;
    income: string;
    expenses: string;
    year: string;
    monthly: string;
    perMonth: string;
    comparedToBookValue: string;
    units: string;
    timeFilter: {
      month: string;
      quarter: string;
      year: string;
      custom: string;
    };
    quickActions: string;
    newBooking: string;
    newTenant: string;
    newTask: string;
    newProperty: string;
    previousYear: string;
    trend: {
      up: string;
      down: string;
      same: string;
    };
  };
  // Properties
  properties: {
    title: string;
    newProperty: string;
    noProperties: string;
    addFirstProperty: string;
    editProperty: string;
    deleteProperty: string;
    deleteConfirm: string;
    name: string;
    address: string;
    city: string;
    postalCode: string;
    purchasePrice: string;
    purchaseDate: string;
    totalArea: string;
    unitsCount: string;
    marketValue: string;
    propertyType: string;
    yearBuilt: string;
    notes: string;
    types: {
      apartment: string;
      house: string;
      commercial: string;
      mixed: string;
    };
    rentedUnits: string;
    livingArea: string;
    currentEstimatedValue: string;
    perSqm: string;
    edit: string;
    markAsFavorite: string;
    removeFromFavorites: string;
  };
  // Units
  units: {
    title: string;
    newUnit: string;
    noUnits: string;
    unitNumber: string;
    floor: string;
    area: string;
    rooms: string;
    baseRent: string;
    additionalCosts: string;
    totalRent: string;
    status: string;
    description: string;
    statusTypes: {
      rented: string;
      vacant: string;
      renovation: string;
      reserved: string;
    };
  };
  // Tenants
  tenants: {
    title: string;
    newTenant: string;
    noTenants: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    moveInDate: string;
    moveOutDate: string;
    deposit: string;
    contractType: string;
    contractStartDate: string;
    contractEndDate: string;
    notes: string;
    contractTypes: {
      fixed: string;
      indefinite: string;
    };
  };
  // Finances
  finances: {
    title: string;
    newTransaction: string;
    noTransactions: string;
    type: string;
    category: string;
    amount: string;
    date: string;
    description: string;
    recurring: string;
    interval: string;
    types: {
      income: string;
      expense: string;
    };
    categories: {
      rent: string;
      utilities: string;
      repairs: string;
      insurance: string;
      mortgage: string;
      reserves: string;
      management: string;
      taxes: string;
      other: string;
    };
    intervals: {
      monthly: string;
      quarterly: string;
      yearly: string;
    };
    exportCSV: string;
    exportExcel: string;
    importCSV: string;
    totalIncome: string;
    totalExpenses: string;
    balance: string;
  };
  // Financing
  financing: {
    title: string;
    newFinancing: string;
    noFinancings: string;
    bankName: string;
    loanNumber: string;
    principalAmount: string;
    interestRate: string;
    repaymentRate: string;
    monthlyRate: string;
    remainingDebt: string;
    startDate: string;
    endDate: string;
    fixedInterestUntil: string;
    notes: string;
    totalDebt: string;
    totalMonthlyRate: string;
  };
  // Depreciation
  depreciation: {
    title: string;
    newItem: string;
    noItems: string;
    name: string;
    category: string;
    purchaseValue: string;
    depreciationRate: string;
    depreciationYears: string;
    startDate: string;
    annualDepreciation: string;
    monthlyDepreciation: string;
    accumulatedDepreciation: string;
    remainingValue: string;
    categories: {
      gebaeude: string;
      moebel: string;
      kueche: string;
      elektro: string;
      inventar: string;
      ausstattung: string;
      sonstiges: string;
    };
  };
  // Documents
  documents: {
    title: string;
    uploadDocument: string;
    noDocuments: string;
    name: string;
    type: string;
    date: string;
    description: string;
    file: string;
    types: {
      rental_contract: string;
      purchase_contract: string;
      invoice: string;
      energy_certificate: string;
      insurance: string;
      mortgage: string;
      other: string;
    };
    upload: string;
    download: string;
    delete: string;
  };
  // Tasks
  tasks: {
    title: string;
    newTask: string;
    noTasks: string;
    title_field: string;
    description: string;
    dueDate: string;
    priority: string;
    status: string;
    category: string;
    completedAt: string;
    priorities: {
      low: string;
      medium: string;
      high: string;
      urgent: string;
    };
    statuses: {
      pending: string;
      in_progress: string;
      completed: string;
      cancelled: string;
    };
    categories: {
      rent_check: string;
      rent_increase: string;
      maintenance: string;
      deadline: string;
      inspection: string;
      other: string;
    };
    overdue: string;
    dueToday: string;
    dueThisWeek: string;
  };
  // Calendar
  calendar: {
    title: string;
    month: string;
    week: string;
    day: string;
    today: string;
    noEvents: string;
    allDay: string;
  };
  // Reports
  reports: {
    title: string;
    generateReport: string;
    reportType: string;
    dateRange: string;
    exportPDF: string;
    annualReport: string;
    cashflowReport: string;
    tenantReport: string;
    propertyReport: string;
  };
  // Settings
  settings: {
    title: string;
    general: string;
    appearance: string;
    notifications: string;
    security: string;
    data: string;
    language: string;
    theme: string;
    themes: {
      light: string;
      dark: string;
      system: string;
    };
    pushNotifications: string;
    emailNotifications: string;
    notificationSettings: {
      dueTasks: string;
      rentIncreases: string;
      contractExpirations: string;
    };
    pinProtection: string;
    changePin: string;
    biometricAuth: string;
    autoLock: string;
    autoLockOptions: {
      never: string;
      '1min': string;
      '5min': string;
      '15min': string;
      '30min': string;
    };
    exportData: string;
    importData: string;
    resetData: string;
    resetConfirm: string;
    version: string;
  };
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    close: string;
    search: string;
    globalSearch: string;
    searchPlaceholder: string;
    noResults: string;
    loading: string;
    error: string;
    success: string;
    confirm: string;
    yes: string;
    no: string;
    required: string;
    optional: string;
    all: string;
    none: string;
    filter: string;
    sort: string;
    actions: string;
    bulkActions: string;
    selected: string;
    deleteSelected: string;
    changeStatus: string;
    export: string;
    import: string;
    download: string;
    upload: string;
    previous: string;
    next: string;
    page: string;
    of: string;
  };
  // Search
  search: {
    placeholder: string;
    properties: string;
    units: string;
    tenants: string;
    documents: string;
    tasks: string;
    recentSearches: string;
    noResults: string;
    shortcut: string;
  };
  // Notifications
  notifications: {
    title: string;
    enabled: string;
    taskDue: string;
    rentIncrease: string;
    contractExpiry: string;
    permissionDenied: string;
    permissionGranted: string;
  };
  // Auth/PIN
  auth: {
    enterPin: string;
    confirmPin: string;
    wrongPin: string;
    pinSet: string;
    pinChanged: string;
    biometricNotAvailable: string;
    unlock: string;
    locked: string;
    forgotPin: string;
    resetPinConfirm: string;
    pinReset: string;
    pinDisabled: string;
    pinLengthError: string;
    setPin: string;
    disablePin: string;
    currentPin: string;
    newPin: string;
    confirmNewPin: string;
    pinMismatch: string;
  };
  // Currency
  currency: {
    title: string;
    defaultCurrency: string;
    propertyCurrency: string;
    exchangeRates: string;
    lastUpdated: string;
    currencies: {
      EUR: string;
      USD: string;
      GBP: string;
      CHF: string;
    };
  };
  // Bulk Actions
  bulkActions: {
    selectAll: string;
    deselectAll: string;
    selectedCount: string;
    deleteSelected: string;
    changeStatus: string;
    exportSelected: string;
    confirmDelete: string;
    itemsDeleted: string;
    statusChanged: string;
  };
  // Touch
  touch: {
    pullToRefresh: string;
    releaseToRefresh: string;
    refreshing: string;
    swipeToDelete: string;
    swipeToEdit: string;
  };
  // Onboarding
  onboarding: {
    welcome: string;
    welcomeDescription: string;
    stepProperty: string;
    stepPropertyDescription: string;
    stepUnits: string;
    stepUnitsDescription: string;
    stepTenants: string;
    stepTenantsDescription: string;
    stepFeatures: string;
    stepFeaturesDescription: string;
    skip: string;
    next: string;
    previous: string;
    getStarted: string;
    step: string;
    of: string;
  };
  // Keyboard Shortcuts
  shortcuts: {
    title: string;
    description: string;
    navigation: string;
    actions: string;
    general: string;
    goToDashboard: string;
    goToProperties: string;
    goToTasks: string;
    goToFinances: string;
    goToSettings: string;
    newItem: string;
    globalSearch: string;
    showShortcuts: string;
    closeDialog: string;
  };
  // Help Tooltips
  help: {
    ltv: string;
    ltvDescription: string;
    roe: string;
    roeDescription: string;
    depreciation: string;
    depreciationDescription: string;
    cashOnCash: string;
    cashOnCashDescription: string;
    learnMore: string;
  };
  // Street View
  streetView: {
    viewOnMap: string;
    streetView: string;
  };
}

export const translations: Record<Language, TranslationStrings> = {
  de: {
    nav: {
      dashboard: 'Dashboard',
      properties: 'Immobilien',
      units: 'Einheiten',
      tenants: 'Mieter',
      finances: 'Finanzen',
      financing: 'Finanzierung',
      depreciation: 'Abschreibungen',
      housemoney: 'Hausgelder',
      documents: 'Dokumente',
      tasks: 'Aufgaben',
      reports: 'Reports',
      settings: 'Einstellungen',
      calendar: 'Kalender',
      more: 'Mehr',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Willkommen bei Bucki',
      properties: 'Immobilien',
      coldRentIncome: 'Kaltmieteneinnahmen',
      assetGrowth: 'Vermögenszuwachs',
      cashflow: 'Cashflow',
      currentDebt: 'Aktuelle Restschulden',
      totalExpenses: 'Ausgaben gesamt',
      depreciation: 'Abschreibungen',
      estimatedValue: 'Aktueller Schätzwert',
      equity: 'Eigenkapital',
      warmRent: 'Warmmiete (gesamt)',
      rentalRate: 'Vermietungsquote',
      rented: 'vermietet',
      vacant: 'leer',
      marketValueIncrease: 'Marktwertsteigerung',
      cashflowOverview: 'Cashflow Übersicht',
      portfolioDistribution: 'Portfolio-Verteilung',
      depreciationByCategory: 'Abschreibungen nach Kategorien',
      monthlyDepreciation: 'monatlich',
      income: 'Einnahmen',
      expenses: 'Ausgaben',
      year: 'Jahr',
      monthly: 'monatlich',
      perMonth: 'pro Monat',
      comparedToBookValue: 'gegenüber Buchwert',
      units: 'Einheiten',
      timeFilter: {
        month: 'Monat',
        quarter: 'Quartal',
        year: 'Jahr',
        custom: 'Individuell',
      },
      quickActions: 'Schnellaktionen',
      newBooking: 'Neue Buchung',
      newTenant: 'Neuer Mieter',
      newTask: 'Neue Aufgabe',
      newProperty: 'Neue Immobilie',
      previousYear: 'Vorjahr',
      trend: {
        up: 'gestiegen',
        down: 'gefallen',
        same: 'gleichgeblieben',
      },
    },
    properties: {
      title: 'Immobilien',
      newProperty: 'Neue Immobilie',
      noProperties: 'Keine Immobilien',
      addFirstProperty: 'Fügen Sie Ihre erste Immobilie hinzu',
      editProperty: 'Immobilie bearbeiten',
      deleteProperty: 'Immobilie löschen',
      deleteConfirm: 'Möchten Sie diese Immobilie wirklich löschen?',
      name: 'Name',
      address: 'Adresse',
      city: 'Stadt',
      postalCode: 'PLZ',
      purchasePrice: 'Kaufpreis',
      purchaseDate: 'Kaufdatum',
      totalArea: 'Wohnfläche',
      unitsCount: 'Anzahl Einheiten',
      marketValue: 'Marktwert',
      propertyType: 'Immobilienart',
      yearBuilt: 'Baujahr',
      notes: 'Notizen',
      types: {
        apartment: 'Wohnung',
        house: 'Haus',
        commercial: 'Gewerbe',
        mixed: 'Gemischt',
      },
      rentedUnits: 'vermietet',
      livingArea: 'Wohnfläche',
      currentEstimatedValue: 'Aktueller Schätzwert',
      perSqm: 'pro m²',
      edit: 'Bearbeiten',
      markAsFavorite: 'Als Favorit markieren',
      removeFromFavorites: 'Aus Favoriten entfernen',
    },
    units: {
      title: 'Einheiten',
      newUnit: 'Neue Einheit',
      noUnits: 'Keine Einheiten',
      unitNumber: 'Einheitsnummer',
      floor: 'Etage',
      area: 'Fläche',
      rooms: 'Zimmer',
      baseRent: 'Kaltmiete',
      additionalCosts: 'Nebenkosten',
      totalRent: 'Warmmiete',
      status: 'Status',
      description: 'Beschreibung',
      statusTypes: {
        rented: 'Vermietet',
        vacant: 'Leer',
        renovation: 'Renovierung',
        reserved: 'Reserviert',
      },
    },
    tenants: {
      title: 'Mieter',
      newTenant: 'Neuer Mieter',
      noTenants: 'Keine Mieter',
      firstName: 'Vorname',
      lastName: 'Nachname',
      email: 'E-Mail',
      phone: 'Telefon',
      street: 'Straße',
      city: 'Stadt',
      postalCode: 'PLZ',
      moveInDate: 'Einzugsdatum',
      moveOutDate: 'Auszugsdatum',
      deposit: 'Kaution',
      contractType: 'Vertragsart',
      contractStartDate: 'Vertragsbeginn',
      contractEndDate: 'Vertragsende',
      notes: 'Notizen',
      contractTypes: {
        fixed: 'Befristet',
        indefinite: 'Unbefristet',
      },
    },
    finances: {
      title: 'Finanzen',
      newTransaction: 'Neue Buchung',
      noTransactions: 'Keine Buchungen',
      type: 'Typ',
      category: 'Kategorie',
      amount: 'Betrag',
      date: 'Datum',
      description: 'Beschreibung',
      recurring: 'Wiederkehrend',
      interval: 'Intervall',
      types: {
        income: 'Einnahme',
        expense: 'Ausgabe',
      },
      categories: {
        rent: 'Miete',
        utilities: 'Nebenkosten',
        repairs: 'Reparaturen',
        insurance: 'Versicherung',
        mortgage: 'Kreditrate',
        reserves: 'Rücklagen',
        management: 'Verwaltung',
        taxes: 'Steuern',
        other: 'Sonstiges',
      },
      intervals: {
        monthly: 'Monatlich',
        quarterly: 'Quartalsweise',
        yearly: 'Jährlich',
      },
      exportCSV: 'CSV Export',
      exportExcel: 'Excel Export',
      importCSV: 'CSV Import',
      totalIncome: 'Einnahmen gesamt',
      totalExpenses: 'Ausgaben gesamt',
      balance: 'Saldo',
    },
    financing: {
      title: 'Finanzierung',
      newFinancing: 'Neue Finanzierung',
      noFinancings: 'Keine Finanzierungen',
      bankName: 'Bank',
      loanNumber: 'Kreditnummer',
      principalAmount: 'Kreditsumme',
      interestRate: 'Zinssatz',
      repaymentRate: 'Tilgungssatz',
      monthlyRate: 'Monatsrate',
      remainingDebt: 'Restschuld',
      startDate: 'Beginn',
      endDate: 'Ende',
      fixedInterestUntil: 'Zinsbindung bis',
      notes: 'Notizen',
      totalDebt: 'Gesamtschulden',
      totalMonthlyRate: 'Gesamtrate',
    },
    depreciation: {
      title: 'Abschreibungen',
      newItem: 'Neue Position',
      noItems: 'Keine Abschreibungen',
      name: 'Bezeichnung',
      category: 'Kategorie',
      purchaseValue: 'Anschaffungswert',
      depreciationRate: 'AfA-Satz',
      depreciationYears: 'Nutzungsdauer',
      startDate: 'Beginn',
      annualDepreciation: 'Jährliche AfA',
      monthlyDepreciation: 'Monatliche AfA',
      accumulatedDepreciation: 'Bisher abgeschrieben',
      remainingValue: 'Restwert',
      categories: {
        gebaeude: 'Gebäude',
        moebel: 'Möbel',
        kueche: 'Küche',
        elektro: 'Elektrogeräte',
        inventar: 'Inventar',
        ausstattung: 'Ausstattung',
        sonstiges: 'Sonstiges',
      },
    },
    documents: {
      title: 'Dokumente',
      uploadDocument: 'Dokument hochladen',
      noDocuments: 'Keine Dokumente',
      name: 'Name',
      type: 'Typ',
      date: 'Datum',
      description: 'Beschreibung',
      file: 'Datei',
      types: {
        rental_contract: 'Mietvertrag',
        purchase_contract: 'Kaufvertrag',
        invoice: 'Rechnung',
        energy_certificate: 'Energieausweis',
        insurance: 'Versicherung',
        mortgage: 'Kreditvertrag',
        other: 'Sonstiges',
      },
      upload: 'Hochladen',
      download: 'Herunterladen',
      delete: 'Löschen',
    },
    tasks: {
      title: 'Aufgaben',
      newTask: 'Neue Aufgabe',
      noTasks: 'Keine Aufgaben',
      title_field: 'Titel',
      description: 'Beschreibung',
      dueDate: 'Fälligkeitsdatum',
      priority: 'Priorität',
      status: 'Status',
      category: 'Kategorie',
      completedAt: 'Erledigt am',
      priorities: {
        low: 'Niedrig',
        medium: 'Mittel',
        high: 'Hoch',
        urgent: 'Dringend',
      },
      statuses: {
        pending: 'Offen',
        in_progress: 'In Bearbeitung',
        completed: 'Erledigt',
        cancelled: 'Abgebrochen',
      },
      categories: {
        rent_check: 'Mietprüfung',
        rent_increase: 'Mieterhöhung',
        maintenance: 'Wartung',
        deadline: 'Frist',
        inspection: 'Inspektion',
        other: 'Sonstiges',
      },
      overdue: 'Überfällig',
      dueToday: 'Heute fällig',
      dueThisWeek: 'Diese Woche fällig',
    },
    calendar: {
      title: 'Kalender',
      month: 'Monat',
      week: 'Woche',
      day: 'Tag',
      today: 'Heute',
      noEvents: 'Keine Termine',
      allDay: 'Ganztägig',
    },
    reports: {
      title: 'Reports',
      generateReport: 'Report erstellen',
      reportType: 'Reporttyp',
      dateRange: 'Zeitraum',
      exportPDF: 'PDF Export',
      annualReport: 'Jahresbericht',
      cashflowReport: 'Cashflow-Bericht',
      tenantReport: 'Mieter-Report',
      propertyReport: 'Immobilien-Report',
    },
    settings: {
      title: 'Einstellungen',
      general: 'Allgemein',
      appearance: 'Darstellung',
      notifications: 'Benachrichtigungen',
      security: 'Sicherheit',
      data: 'Daten',
      language: 'Sprache',
      theme: 'Design',
      themes: {
        light: 'Hell',
        dark: 'Dunkel',
        system: 'System',
      },
      pushNotifications: 'Push-Benachrichtigungen',
      emailNotifications: 'E-Mail-Benachrichtigungen',
      notificationSettings: {
        dueTasks: 'Fällige Aufgaben',
        rentIncreases: 'Mieterhöhungen',
        contractExpirations: 'Vertragsabläufe',
      },
      pinProtection: 'PIN-Schutz',
      changePin: 'PIN ändern',
      biometricAuth: 'Biometrische Authentifizierung',
      autoLock: 'Automatische Sperre',
      autoLockOptions: {
        never: 'Nie',
        '1min': '1 Minute',
        '5min': '5 Minuten',
        '15min': '15 Minuten',
        '30min': '30 Minuten',
      },
      exportData: 'Daten exportieren',
      importData: 'Daten importieren',
      resetData: 'Daten zurücksetzen',
      resetConfirm: 'Alle Daten wirklich zurücksetzen?',
      version: 'Version',
    },
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      add: 'Hinzufügen',
      close: 'Schließen',
      search: 'Suchen',
      globalSearch: 'Globale Suche',
      searchPlaceholder: 'Suchen...',
      noResults: 'Keine Ergebnisse',
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
      confirm: 'Bestätigen',
      yes: 'Ja',
      no: 'Nein',
      required: 'Erforderlich',
      optional: 'Optional',
      all: 'Alle',
      none: 'Keine',
      filter: 'Filter',
      sort: 'Sortieren',
      actions: 'Aktionen',
      bulkActions: 'Sammelaktionen',
      selected: 'ausgewählt',
      deleteSelected: 'Ausgewählte löschen',
      changeStatus: 'Status ändern',
      export: 'Exportieren',
      import: 'Importieren',
      download: 'Herunterladen',
      upload: 'Hochladen',
      previous: 'Zurück',
      next: 'Weiter',
      page: 'Seite',
      of: 'von',
    },
    search: {
      placeholder: 'Immobilien, Mieter, Dokumente suchen... (Ctrl+K)',
      properties: 'Immobilien',
      units: 'Einheiten',
      tenants: 'Mieter',
      documents: 'Dokumente',
      tasks: 'Aufgaben',
      recentSearches: 'Zuletzt gesucht',
      noResults: 'Keine Ergebnisse gefunden',
      shortcut: 'Ctrl+K',
    },
    notifications: {
      title: 'Benachrichtigungen',
      enabled: 'Aktiviert',
      taskDue: 'Aufgabe fällig',
      rentIncrease: 'Mieterhöhung',
      contractExpiry: 'Vertragsablauf',
      permissionDenied: 'Berechtigung verweigert',
      permissionGranted: 'Berechtigung erteilt',
    },
    auth: {
      enterPin: 'PIN eingeben',
      confirmPin: 'PIN bestätigen',
      wrongPin: 'Falsche PIN',
      pinSet: 'PIN gesetzt',
      pinChanged: 'PIN geändert',
      biometricNotAvailable: 'Biometrie nicht verfügbar',
      unlock: 'Entsperren',
      locked: 'Gesperrt',
      forgotPin: 'PIN vergessen?',
      resetPinConfirm: 'Durch das Zurücksetzen werden alle Daten gelöscht. Fortfahren?',
      pinReset: 'PIN zurückgesetzt',
      pinDisabled: 'PIN-Schutz deaktiviert',
      pinLengthError: 'PIN muss 4-6 Ziffern haben',
      setPin: 'PIN festlegen',
      disablePin: 'PIN deaktivieren',
      currentPin: 'Aktuelle PIN',
      newPin: 'Neue PIN',
      confirmNewPin: 'Neue PIN bestätigen',
      pinMismatch: 'PINs stimmen nicht überein',
    },
    currency: {
      title: 'Währung',
      defaultCurrency: 'Standardwährung',
      propertyCurrency: 'Währung pro Immobilie',
      exchangeRates: 'Wechselkurse',
      lastUpdated: 'Zuletzt aktualisiert',
      currencies: {
        EUR: 'Euro (€)',
        USD: 'US-Dollar ($)',
        GBP: 'Britisches Pfund (£)',
        CHF: 'Schweizer Franken (CHF)',
      },
    },
    bulkActions: {
      selectAll: 'Alle auswählen',
      deselectAll: 'Auswahl aufheben',
      selectedCount: 'ausgewählt',
      deleteSelected: 'Ausgewählte löschen',
      changeStatus: 'Status ändern',
      exportSelected: 'Ausgewählte exportieren',
      confirmDelete: 'Ausgewählte Einträge wirklich löschen?',
      itemsDeleted: 'Einträge gelöscht',
      statusChanged: 'Status geändert',
    },
    touch: {
      pullToRefresh: 'Ziehen zum Aktualisieren',
      releaseToRefresh: 'Loslassen zum Aktualisieren',
      refreshing: 'Aktualisieren...',
      swipeToDelete: 'Wischen zum Löschen',
      swipeToEdit: 'Wischen zum Bearbeiten',
    },
    onboarding: {
      welcome: 'Willkommen bei Bucki',
      welcomeDescription: 'Ihre Immobilienverwaltung auf einen Blick',
      stepProperty: 'Immobilie hinzufügen',
      stepPropertyDescription: 'Erfassen Sie Ihre erste Immobilie mit allen wichtigen Daten',
      stepUnits: 'Einheiten konfigurieren',
      stepUnitsDescription: 'Definieren Sie Wohnungen, Flächen und Mieten',
      stepTenants: 'Mieter anlegen',
      stepTenantsDescription: 'Verwalten Sie Ihre Mieter und Verträge',
      stepFeatures: 'Features entdecken',
      stepFeaturesDescription: 'Lernen Sie die wichtigsten Funktionen kennen',
      skip: 'Überspringen',
      next: 'Weiter',
      previous: 'Zurück',
      getStarted: 'Starten',
      step: 'Schritt',
      of: 'von',
    },
    shortcuts: {
      title: 'Tastaturkürzel',
      description: 'Nutzen Sie diese Kürzel für schnelleres Arbeiten',
      navigation: 'Navigation',
      actions: 'Aktionen',
      general: 'Allgemein',
      goToDashboard: 'Zum Dashboard',
      goToProperties: 'Zu den Immobilien',
      goToTasks: 'Zu den Aufgaben',
      goToFinances: 'Zu den Finanzen',
      goToSettings: 'Zu den Einstellungen',
      newItem: 'Neues Element (kontextabhängig)',
      globalSearch: 'Globale Suche öffnen',
      showShortcuts: 'Tastaturkürzel anzeigen',
      closeDialog: 'Dialog schließen',
    },
    help: {
      ltv: 'Loan-to-Value (LTV)',
      ltvDescription: 'Das Verhältnis von Kreditbetrag zum Verkehrswert der Immobilie. Ein niedriger LTV (unter 80%) gilt als sicherer.',
      roe: 'Eigenkapitalrendite (ROE)',
      roeDescription: 'Die Rendite auf das eingesetzte Eigenkapital. Eine ROE über 10% gilt als gute Investition.',
      depreciation: 'Abschreibung (AfA)',
      depreciationDescription: 'Die steuerlich absetzbare Wertminderung. Gebäude werden linear über 2-3% p.a. abgeschrieben.',
      cashOnCash: 'Cash-on-Cash Return',
      cashOnCashDescription: 'Die Rendite auf das tatsächlich investierte Eigenkapital.',
      learnMore: 'Mehr erfahren',
    },
    streetView: {
      viewOnMap: 'Auf Karte anzeigen',
      streetView: 'Street View',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      properties: 'Properties',
      units: 'Units',
      tenants: 'Tenants',
      finances: 'Finances',
      financing: 'Financing',
      depreciation: 'Depreciation',
      housemoney: 'House Money',
      documents: 'Documents',
      tasks: 'Tasks',
      reports: 'Reports',
      settings: 'Settings',
      calendar: 'Calendar',
      more: 'More',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome to Bucki',
      properties: 'Properties',
      coldRentIncome: 'Cold Rent Income',
      assetGrowth: 'Asset Growth',
      cashflow: 'Cashflow',
      currentDebt: 'Current Debt',
      totalExpenses: 'Total Expenses',
      depreciation: 'Depreciation',
      estimatedValue: 'Current Estimated Value',
      equity: 'Equity',
      warmRent: 'Warm Rent (total)',
      rentalRate: 'Rental Rate',
      rented: 'rented',
      vacant: 'vacant',
      marketValueIncrease: 'Market Value Increase',
      cashflowOverview: 'Cashflow Overview',
      portfolioDistribution: 'Portfolio Distribution',
      depreciationByCategory: 'Depreciation by Category',
      monthlyDepreciation: 'monthly',
      income: 'Income',
      expenses: 'Expenses',
      year: 'Year',
      monthly: 'monthly',
      perMonth: 'per month',
      comparedToBookValue: 'compared to book value',
      units: 'units',
      timeFilter: {
        month: 'Month',
        quarter: 'Quarter',
        year: 'Year',
        custom: 'Custom',
      },
      quickActions: 'Quick Actions',
      newBooking: 'New Booking',
      newTenant: 'New Tenant',
      newTask: 'New Task',
      newProperty: 'New Property',
      previousYear: 'Previous Year',
      trend: {
        up: 'increased',
        down: 'decreased',
        same: 'unchanged',
      },
    },
    properties: {
      title: 'Properties',
      newProperty: 'New Property',
      noProperties: 'No Properties',
      addFirstProperty: 'Add your first property',
      editProperty: 'Edit Property',
      deleteProperty: 'Delete Property',
      deleteConfirm: 'Are you sure you want to delete this property?',
      name: 'Name',
      address: 'Address',
      city: 'City',
      postalCode: 'Postal Code',
      purchasePrice: 'Purchase Price',
      purchaseDate: 'Purchase Date',
      totalArea: 'Living Area',
      unitsCount: 'Number of Units',
      marketValue: 'Market Value',
      propertyType: 'Property Type',
      yearBuilt: 'Year Built',
      notes: 'Notes',
      types: {
        apartment: 'Apartment',
        house: 'House',
        commercial: 'Commercial',
        mixed: 'Mixed',
      },
      rentedUnits: 'rented',
      livingArea: 'Living Area',
      currentEstimatedValue: 'Current Estimated Value',
      perSqm: 'per m²',
      edit: 'Edit',
      markAsFavorite: 'Mark as Favorite',
      removeFromFavorites: 'Remove from Favorites',
    },
    units: {
      title: 'Units',
      newUnit: 'New Unit',
      noUnits: 'No Units',
      unitNumber: 'Unit Number',
      floor: 'Floor',
      area: 'Area',
      rooms: 'Rooms',
      baseRent: 'Base Rent',
      additionalCosts: 'Additional Costs',
      totalRent: 'Total Rent',
      status: 'Status',
      description: 'Description',
      statusTypes: {
        rented: 'Rented',
        vacant: 'Vacant',
        renovation: 'Renovation',
        reserved: 'Reserved',
      },
    },
    tenants: {
      title: 'Tenants',
      newTenant: 'New Tenant',
      noTenants: 'No Tenants',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      street: 'Street',
      city: 'City',
      postalCode: 'Postal Code',
      moveInDate: 'Move-in Date',
      moveOutDate: 'Move-out Date',
      deposit: 'Deposit',
      contractType: 'Contract Type',
      contractStartDate: 'Contract Start',
      contractEndDate: 'Contract End',
      notes: 'Notes',
      contractTypes: {
        fixed: 'Fixed Term',
        indefinite: 'Indefinite',
      },
    },
    finances: {
      title: 'Finances',
      newTransaction: 'New Transaction',
      noTransactions: 'No Transactions',
      type: 'Type',
      category: 'Category',
      amount: 'Amount',
      date: 'Date',
      description: 'Description',
      recurring: 'Recurring',
      interval: 'Interval',
      types: {
        income: 'Income',
        expense: 'Expense',
      },
      categories: {
        rent: 'Rent',
        utilities: 'Utilities',
        repairs: 'Repairs',
        insurance: 'Insurance',
        mortgage: 'Mortgage',
        reserves: 'Reserves',
        management: 'Management',
        taxes: 'Taxes',
        other: 'Other',
      },
      intervals: {
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        yearly: 'Yearly',
      },
      exportCSV: 'CSV Export',
      exportExcel: 'Excel Export',
      importCSV: 'CSV Import',
      totalIncome: 'Total Income',
      totalExpenses: 'Total Expenses',
      balance: 'Balance',
    },
    financing: {
      title: 'Financing',
      newFinancing: 'New Financing',
      noFinancings: 'No Financing',
      bankName: 'Bank',
      loanNumber: 'Loan Number',
      principalAmount: 'Principal Amount',
      interestRate: 'Interest Rate',
      repaymentRate: 'Repayment Rate',
      monthlyRate: 'Monthly Rate',
      remainingDebt: 'Remaining Debt',
      startDate: 'Start Date',
      endDate: 'End Date',
      fixedInterestUntil: 'Fixed Interest Until',
      notes: 'Notes',
      totalDebt: 'Total Debt',
      totalMonthlyRate: 'Total Monthly Rate',
    },
    depreciation: {
      title: 'Depreciation',
      newItem: 'New Item',
      noItems: 'No Depreciation Items',
      name: 'Name',
      category: 'Category',
      purchaseValue: 'Purchase Value',
      depreciationRate: 'Depreciation Rate',
      depreciationYears: 'Useful Life',
      startDate: 'Start Date',
      annualDepreciation: 'Annual Depreciation',
      monthlyDepreciation: 'Monthly Depreciation',
      accumulatedDepreciation: 'Accumulated Depreciation',
      remainingValue: 'Remaining Value',
      categories: {
        gebaeude: 'Building',
        moebel: 'Furniture',
        kueche: 'Kitchen',
        elektro: 'Electronics',
        inventar: 'Inventory',
        ausstattung: 'Equipment',
        sonstiges: 'Other',
      },
    },
    documents: {
      title: 'Documents',
      uploadDocument: 'Upload Document',
      noDocuments: 'No Documents',
      name: 'Name',
      type: 'Type',
      date: 'Date',
      description: 'Description',
      file: 'File',
      types: {
        rental_contract: 'Rental Contract',
        purchase_contract: 'Purchase Contract',
        invoice: 'Invoice',
        energy_certificate: 'Energy Certificate',
        insurance: 'Insurance',
        mortgage: 'Mortgage',
        other: 'Other',
      },
      upload: 'Upload',
      download: 'Download',
      delete: 'Delete',
    },
    tasks: {
      title: 'Tasks',
      newTask: 'New Task',
      noTasks: 'No Tasks',
      title_field: 'Title',
      description: 'Description',
      dueDate: 'Due Date',
      priority: 'Priority',
      status: 'Status',
      category: 'Category',
      completedAt: 'Completed At',
      priorities: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent',
      },
      statuses: {
        pending: 'Pending',
        in_progress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      categories: {
        rent_check: 'Rent Check',
        rent_increase: 'Rent Increase',
        maintenance: 'Maintenance',
        deadline: 'Deadline',
        inspection: 'Inspection',
        other: 'Other',
      },
      overdue: 'Overdue',
      dueToday: 'Due Today',
      dueThisWeek: 'Due This Week',
    },
    calendar: {
      title: 'Calendar',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      today: 'Today',
      noEvents: 'No Events',
      allDay: 'All Day',
    },
    reports: {
      title: 'Reports',
      generateReport: 'Generate Report',
      reportType: 'Report Type',
      dateRange: 'Date Range',
      exportPDF: 'PDF Export',
      annualReport: 'Annual Report',
      cashflowReport: 'Cashflow Report',
      tenantReport: 'Tenant Report',
      propertyReport: 'Property Report',
    },
    settings: {
      title: 'Settings',
      general: 'General',
      appearance: 'Appearance',
      notifications: 'Notifications',
      security: 'Security',
      data: 'Data',
      language: 'Language',
      theme: 'Theme',
      themes: {
        light: 'Light',
        dark: 'Dark',
        system: 'System',
      },
      pushNotifications: 'Push Notifications',
      emailNotifications: 'Email Notifications',
      notificationSettings: {
        dueTasks: 'Due Tasks',
        rentIncreases: 'Rent Increases',
        contractExpirations: 'Contract Expirations',
      },
      pinProtection: 'PIN Protection',
      changePin: 'Change PIN',
      biometricAuth: 'Biometric Authentication',
      autoLock: 'Auto Lock',
      autoLockOptions: {
        never: 'Never',
        '1min': '1 Minute',
        '5min': '5 Minutes',
        '15min': '15 Minutes',
        '30min': '30 Minutes',
      },
      exportData: 'Export Data',
      importData: 'Import Data',
      resetData: 'Reset Data',
      resetConfirm: 'Really reset all data?',
      version: 'Version',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      search: 'Search',
      globalSearch: 'Global Search',
      searchPlaceholder: 'Search...',
      noResults: 'No Results',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      required: 'Required',
      optional: 'Optional',
      all: 'All',
      none: 'None',
      filter: 'Filter',
      sort: 'Sort',
      actions: 'Actions',
      bulkActions: 'Bulk Actions',
      selected: 'selected',
      deleteSelected: 'Delete Selected',
      changeStatus: 'Change Status',
      export: 'Export',
      import: 'Import',
      download: 'Download',
      upload: 'Upload',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
    },
    search: {
      placeholder: 'Search properties, tenants, documents... (Ctrl+K)',
      properties: 'Properties',
      units: 'Units',
      tenants: 'Tenants',
      documents: 'Documents',
      tasks: 'Tasks',
      recentSearches: 'Recent Searches',
      noResults: 'No results found',
      shortcut: 'Ctrl+K',
    },
    notifications: {
      title: 'Notifications',
      enabled: 'Enabled',
      taskDue: 'Task Due',
      rentIncrease: 'Rent Increase',
      contractExpiry: 'Contract Expiry',
      permissionDenied: 'Permission Denied',
      permissionGranted: 'Permission Granted',
    },
    auth: {
      enterPin: 'Enter PIN',
      confirmPin: 'Confirm PIN',
      wrongPin: 'Wrong PIN',
      pinSet: 'PIN Set',
      pinChanged: 'PIN Changed',
      biometricNotAvailable: 'Biometric not available',
      unlock: 'Unlock',
      locked: 'Locked',
      forgotPin: 'Forgot PIN?',
      resetPinConfirm: 'Resetting will delete all data. Continue?',
      pinReset: 'PIN reset',
      pinDisabled: 'PIN protection disabled',
      pinLengthError: 'PIN must be 4-6 digits',
      setPin: 'Set PIN',
      disablePin: 'Disable PIN',
      currentPin: 'Current PIN',
      newPin: 'New PIN',
      confirmNewPin: 'Confirm New PIN',
      pinMismatch: 'PINs do not match',
    },
    currency: {
      title: 'Currency',
      defaultCurrency: 'Default Currency',
      propertyCurrency: 'Currency per Property',
      exchangeRates: 'Exchange Rates',
      lastUpdated: 'Last Updated',
      currencies: {
        EUR: 'Euro (€)',
        USD: 'US Dollar ($)',
        GBP: 'British Pound (£)',
        CHF: 'Swiss Franc (CHF)',
      },
    },
    bulkActions: {
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      selectedCount: 'selected',
      deleteSelected: 'Delete Selected',
      changeStatus: 'Change Status',
      exportSelected: 'Export Selected',
      confirmDelete: 'Delete selected items?',
      itemsDeleted: 'Items deleted',
      statusChanged: 'Status changed',
    },
    touch: {
      pullToRefresh: 'Pull to refresh',
      releaseToRefresh: 'Release to refresh',
      refreshing: 'Refreshing...',
      swipeToDelete: 'Swipe to delete',
      swipeToEdit: 'Swipe to edit',
    },
    onboarding: {
      welcome: 'Welcome to Bucki',
      welcomeDescription: 'Your property management at a glance',
      stepProperty: 'Add your first property',
      stepPropertyDescription: 'Add your first property with all important details',
      stepUnits: 'Configure units',
      stepUnitsDescription: 'Define apartments, areas, and rents',
      stepTenants: 'Set up tenants',
      stepTenantsDescription: 'Manage your tenants and contracts',
      stepFeatures: 'Explore features',
      stepFeaturesDescription: 'Get to know the key features',
      skip: 'Skip',
      next: 'Next',
      previous: 'Back',
      getStarted: 'Get Started',
      step: 'Step',
      of: 'of',
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      description: 'Use these shortcuts to work faster',
      navigation: 'Navigation',
      actions: 'Actions',
      general: 'General',
      goToDashboard: 'Go to Dashboard',
      goToProperties: 'Go to Properties',
      goToTasks: 'Go to Tasks',
      goToFinances: 'Go to Finances',
      goToSettings: 'Go to Settings',
      newItem: 'New item (context-aware)',
      globalSearch: 'Open global search',
      showShortcuts: 'Show keyboard shortcuts',
      closeDialog: 'Close dialog',
    },
    help: {
      ltv: 'Loan-to-Value (LTV)',
      ltvDescription: 'The ratio of loan amount to the market value of the property. A lower LTV (under 80%) is considered safer.',
      roe: 'Return on Equity (ROE)',
      roeDescription: 'The return on invested equity. An ROE above 10% is considered a good investment.',
      depreciation: 'Depreciation',
      depreciationDescription: 'The tax-deductible decrease in value. Buildings are depreciated linearly at 2-3% p.a.',
      cashOnCash: 'Cash-on-Cash Return',
      cashOnCashDescription: 'The return on actually invested equity.',
      learnMore: 'Learn more',
    },
    streetView: {
      viewOnMap: 'View on Map',
      streetView: 'Street View',
    },
  },
};
