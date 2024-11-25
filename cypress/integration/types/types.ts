export type ClusterData = {
    name: string;
    url: string;
    token: string;
    registryPath?: string;
};

export type RepoData = {
  type: string;
  name: string;
  bucket: string;
  region?: string;
  url?: string;
  key: string;
  secret: string;
};

export type PlanData = {
  name: string;
  source: string;
  target?: string;
  repo?: string;
  migration_type: string;
  namespaceList : string[];
  verifyCopy?: boolean;
  directPvmigration?: boolean;
  directImageMigration?: boolean;
  nondefaultTargetNamespace?: boolean;
};
