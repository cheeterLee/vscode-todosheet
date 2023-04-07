declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_CLIENT_ID: string;
      GITHUB_CLIENT_SECRET: string;
      JWT_SECRET: string;
      PGHOST: string;
      PGUSERNAME: string
      PGPASSWORD: string
      PGPORT: number
      PGDATABASE: string
    }
  }
}

export {}
