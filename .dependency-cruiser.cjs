/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ===========================================
    // DOMAIN LAYER RULES - Domain must be PURE
    // ===========================================
    {
      name: 'domain-cannot-import-application',
      comment: 'Domain layer cannot import from application layer',
      severity: 'error',
      from: { path: 'src/modules/[^/]+/domain' },
      to: { path: 'src/modules/[^/]+/application' },
    },
    {
      name: 'domain-cannot-import-infrastructure',
      comment: 'Domain layer cannot import from infrastructure layer',
      severity: 'error',
      from: { path: 'src/modules/[^/]+/domain' },
      to: { path: 'src/modules/[^/]+/infrastructure' },
    },

    // ===========================================
    // BOUNDED CONTEXT ISOLATION RULES
    // ===========================================
    {
      name: 'pricing-cannot-import-warehouse-domain',
      comment: 'Pricing context cannot directly access Warehouse domain internals',
      severity: 'error',
      from: { path: 'src/modules/pricing' },
      to: { path: 'src/modules/warehouse/domain' },
    },
    {
      name: 'pricing-cannot-import-warehouse-infrastructure',
      comment: 'Pricing context cannot access Warehouse infrastructure',
      severity: 'error',
      from: { path: 'src/modules/pricing' },
      to: { path: 'src/modules/warehouse/infrastructure' },
    },
    {
      name: 'warehouse-cannot-import-pricing',
      comment: 'Warehouse context cannot import from Pricing context',
      severity: 'error',
      from: { path: 'src/modules/warehouse' },
      to: { path: 'src/modules/pricing' },
    },

    // ===========================================
    // SHARED CONTRACT RULES
    // ===========================================
    {
      name: 'only-pricing-can-consume-warehouse-contract',
      comment: 'Only Pricing context can consume Warehouse published contracts',
      severity: 'error',
      from: {
        path: 'src/modules/(?!pricing)',
        pathNot: ['src/modules/warehouse', 'src/shared'],
      },
      to: { path: 'src/shared/contract/warehouse' },
    },

    // ===========================================
    // GENERAL CLEAN ARCHITECTURE RULES
    // ===========================================
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies are not allowed',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      comment: 'Modules should be connected to the dependency graph',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          'src/index\\.ts$',
          'src/modules/[^/]+/infrastructure/di\\.ts$',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
      text: {
        highlightFocused: true,
      },
    },
  },
};
