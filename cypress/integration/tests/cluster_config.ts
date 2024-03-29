import { ClusterData, PlanData } from '../types/types';
import { RepoData } from '../types/types';
import { planData } from './cluster_config_bk';

export const clusterData: ClusterData = {
  name: 'source-cluster-1s',
  url: 'https://ec2-3-93-47-241.compute-1.amazonaws.com:8443',
  token: '8443',
};

export const repoData: RepoData = {
  type: 'AWS S3',
  name: 'automatic-1',
  bucket: 'camreplication',
  region: 'us-east-2',
  key: 'key',
  secret: 'secret',
};

export const noVerifyCopyPlanData: PlanData = {
  name: 'migration-without-verify-copy',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini'],
  directImageMigration : false,
  directPvmigration : false,
};

export const verifyCopyPlanData: PlanData = {
  name: 'migration-with-copy-verify',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini'],
  verifyCopy : true,
};

export const directPvPlanData: PlanData = {
  name: 'direct-pv-migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini'],
  directPvmigration : true,
}

export const verifyCopydirectPvPlan: PlanData = {
  name: 'direct-pv-migration-with-copy-verify',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini'],
  directPvmigration : true,
  verifyCopy : true,
}

export const directImagePlanData: PlanData = {
  name: 'direct-image-migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini'],
  directImageMigration : true,
}

export const directImagePvPlan: PlanData = {
  name: 'direct-image-pv-migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini'],
  directImageMigration : true,
  directPvmigration : true,
}

export const indirectMultipleProjects: PlanData = {
  name: 'indirect-migration-of-multiple-projects',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini', 'chandra'],
  directImageMigration : false,
  directPvmigration : false,
}

export const directMultipleProjects: PlanData = {
  name: 'direct-migration-of-multiple-projects',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini', 'chandra'],
  directImageMigration : false,
  directPvmigration : false,
}

export const changeTargetNamespace: PlanData = {
  name: 'direct-migration-with-nondefault-target-namespace',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini'],
  directImageMigration : false,
  directPvmigration : false,
  nondefaultTargetNamespace : true,
};

export const IndirectChangeTargetNamespace: PlanData = {
  name: 'indirect-migration-with-nondefault-target-namespace',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['nandini'],
  directImageMigration : true,
  directPvmigration : true,
  nondefaultTargetNamespace : true,
}
