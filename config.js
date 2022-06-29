module.exports = {
  port: process.env.PORT || 8080,
  api: process.env.API_URL,
  workflow: process.env.WORKFLOW_SERVICE,
  search: process.env.SEARCH_SERVICE,
  metrics: process.env.METRICS_SERVICE,
  auth: {
    realm: process.env.KEYCLOAK_REALM,
    url: process.env.KEYCLOAK_URL,
    client: process.env.KEYCLOAK_CLIENT,
    secret: process.env.KEYCLOAK_SECRET,
    permissions: process.env.PERMISSIONS_SERVICE
  },
  db: {
    database: process.env.DATABASE_NAME || 'asl',
    host: process.env.DATABASE_HOST,
    password: process.env.DATABASE_PASSWORD || 'test-password',
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USERNAME || 'postgres'
  },
  bodySizeLimit: process.env.BODY_SIZE_LIMIT
};
