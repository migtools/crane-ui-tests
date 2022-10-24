import { ClusterData, PlanData } from '../types/types';
import { RepoData } from '../types/types';


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
  migration_type: 'Full migration',
  namespaceList: ['migration-without-verify-copy-namespace'],
  directImageMigration : false,
  directPvmigration : false,
};

export const verifyCopyPlanData: PlanData = {
  name: 'migration-with-copy-verify',
  source: 'source-cluster',
  target: 'host',
  migration_type: 'Full migration',
  repo: 'automatic',
  namespaceList: ['migration-with-copy-verify-namespace'],
  verifyCopy : true,
};

export const directPvPlanData: PlanData = {
  name: 'direct-pv-migration',
  migration_type: 'Full migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['direct-pv-migration-namespace'],
  directPvmigration : true,
}

export const verifyCopydirectPvPlan: PlanData = {
  name: 'direct-pv-migration-with-copy-verify',
  migration_type: 'Full migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['direct-pv-migration-with-copy-verify-namespace'],
  directPvmigration : true,
  verifyCopy : true,
}

export const directImagePlanData: PlanData = {
  name: 'direct-image-migration',
  migration_type: 'Full migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['direct-image-migration-namespace'],
  directImageMigration : true,
}

export const directImagePvPlan: PlanData = {
  name: 'direct-image-pv-migration',
  migration_type: 'Full migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['direct-image-pv-migration-namespace'],
  directImageMigration : true,
  directPvmigration : true,
}

export const indirectMultipleProjects: PlanData = {
  name: 'indirect-migration-of-multiple-projects',
  migration_type: 'Full migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['indirect-migration-of-multiple-projects-namespace-a', 'indirect-migration-of-multiple-projects-namespace-b'],
  directImageMigration : false,
  directPvmigration : false,
}

export const directMultipleProjects: PlanData = {
  name: 'direct-migration-of-multiple-projects',
  migration_type: 'Full migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['direct-migration-of-multiple-projects-namespace-a', 'direct-migration-of-multiple-projects-namespace-b'],
  directImageMigration : true,
  directPvmigration : true,
}

export const changeTargetNamespace: PlanData = {
  name: 'direct-migration-with-nondefault-target-namespace',
  migration_type: 'Full migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['direct-migration-with-nondefault-target-namespace'],
  directImageMigration : true,
  directPvmigration : true,
  nondefaultTargetNamespace : true,
};

export const IndirectChangeTargetNamespace: PlanData = {
  name: 'indirect-migration-with-nondefault-target-namespace',
  migration_type: 'Full migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['indirect-migration-with-nondefault-target-namespace'],
  directImageMigration : false,
  directPvmigration : false,
  nondefaultTargetNamespace : true,
}

export const storageClassConversionSource: PlanData = {
  name: 'scc-source',
  migration_type: 'Storage class conversion',
  source: 'source-cluster',
  repo: 'automatic',
  namespaceList: ['scc-source-namespace']
}

export const storageClassConversionTarget: PlanData = {
  name: 'scc-target',
  migration_type: 'Storage class conversion',
  source: 'host',
  repo: 'automatic',
  namespaceList: ['scc-target-namespace']
}

export const InterclusterState: PlanData = {
  name: 'inter-state-plan',
  migration_type: 'State migration',
  source: 'source-cluster',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['inter-state-plan-namespace']
}

export const IntraClusterStateSource: PlanData = {
  name: 'intra-cluster-source',
  migration_type: 'State migration',
  source: 'source-cluster',
  target: 'source-cluster',
  repo: 'automatic',
  namespaceList: ['intra-state-plan-source']
}

export const IntraClusterStateTarget: PlanData = {
  name: 'intra-cluster-target',
  migration_type: 'State migration',
  source: 'host',
  target: 'host',
  repo: 'automatic',
  namespaceList: ['intra-state-plan-host']
}