import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as gcp from "@pulumi/gcp";

// Manufacture a GKE-style Kubeconfig. Note that this is slightly
// "different" because of the way GKE requires gcloud to be in the
// picture for cluster authentication (rather than using the client
// cert/key directly).
export function createKubeconfig(
    name: pulumi.Output<string>,
    endpoint: pulumi.Output<string>,
    masterAuth: pulumi.Output<gcp.types.output.container.ClusterMasterAuth>,
): pulumi.Output<any> {
    return pulumi.all([
        name, endpoint, masterAuth,
    ]).apply(([projectName, endpoint, auth]) => {
        const context = `${gcp.config.project}_${gcp.config.zone}_${projectName}`;
        return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${auth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    auth-provider:
      config:
        cmd-args: config config-helper --format=json
        cmd-path: gcloud
        expiry-key: '{.credential.token_expiry}'
        token-key: '{.credential.access_token}'
      name: gcp
`;
    });
}

// GcpSaToRoleArgs is the options to bind a GCP ServiceAccount to GCP IAM roles.
export interface GcpSaToRoleArgs {
    project: pulumi.Input<string>;
    roles: string[];
    serviceAccount: gcp.serviceAccount.Account;
}
// bindGcpSaToRole binds a GCP ServiceAccount to a set of GCP IAM roles.
export function bindGcpSaToRole(
    name: string,
    args: GcpSaToRoleArgs): gcp.projects.IAMBinding[] {
    let iamBindings: gcp.projects.IAMBinding[] = [];
    args.roles.forEach((role, index) => {
        iamBindings.push(new gcp.projects.IAMBinding(`${name}-iam-${index}`, {
            project: args.project,
            role: role,
            members: [args.serviceAccount.email.apply(email => `serviceAccount:${email}`)],
        }));
    })
    return iamBindings;
}

// K8sSaToGcpSaArgs is the options to bind a Kubernetes ServiceAccount to a
// GCP ServiceAccount.
export interface K8sSaToGcpSaArgs {
    gcpProject: pulumi.Input<string>;
    k8sServiceAccount: k8s.core.v1.ServiceAccount;
    gcpServiceAccount: gcp.serviceAccount.Account;
}
// bindK8sSaToGcpSa binds a Kubernetes ServiceAccount to a GCP Service account
// using the IAM role workloadIdentityUser.
// https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity
export function bindK8sSaToGcpSa(
    name: string,
    args: K8sSaToGcpSaArgs): gcp.serviceAccount.IAMBinding
{
    return new gcp.serviceAccount.IAMBinding(`${name}`, {
        role: "roles/iam.workloadIdentityUser",
        members: [pulumi.interpolate
            `serviceAccount:${args.gcpProject}.svc.id.goog[${args.k8sServiceAccount.metadata.namespace}/${args.k8sServiceAccount.metadata.name}]`
        ],
        serviceAccountId: args.gcpServiceAccount.id,
    });
}
