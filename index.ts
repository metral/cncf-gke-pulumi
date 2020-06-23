import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as rand from "@pulumi/random";
import * as k8s from "@pulumi/kubernetes";
import { config } from "./config";
import * as utils from "./utils";
import * as knative from "./knative";
import * as secrets from "./secrets";
import * as streaming from "./streaming";
import * as cicd from "./cicd";
import * as crypto from "crypto";

const projectName = pulumi.getProject();
const stackName = pulumi.getStack();

//============================================================================== 
/*
 * GKE Cluster
 */
//============================================================================== 

// Generate a strong password for the cluster.
const password = new rand.RandomPassword(`${projectName}-password`, { 
    length: 20,
},{ additionalSecretOutputs: ["result"] }).result;

// Create the GKE cluster.
const cluster = new gcp.container.Cluster(`${projectName}`, {
    initialNodeCount: 3,
    minMasterVersion: "1.16.8-gke.15",
    nodeConfig: {
        machineType: "n1-standard-2",
        oauthScopes: [
            "https://www.googleapis.com/auth/compute",
            "https://www.googleapis.com/auth/devstorage.read_only",
            "https://www.googleapis.com/auth/logging.write",
            "https://www.googleapis.com/auth/monitoring",
        ],
        labels: {"instanceType": "n1-standard-2"},
        tags: ["pulumi-knative"],
        // See: https://cloud.google.com/kubernetes-engine/docs/reference/rest/v1beta1/NodeConfig
        // Needed for workload identity to validate pods.
        workloadMetadataConfig: {
            nodeMetadata: "GKE_METADATA_SERVER",
        },
    },
    masterAuth: {username: "example-user", password: password},
    // Allow k8s ServiceAccounts to use GCP ServiceAccounts.
    // https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity
    workloadIdentityConfig: {identityNamespace: `${config.gcpProject}.svc.id.goog`},
});
export const clusterName = cluster.name;
export const kubeconfig = utils.createKubeconfig(clusterName, cluster.endpoint, cluster.masterAuth);

// Create a k8s provider instance of the cluster.
const provider = new k8s.Provider(`${projectName}-gke`, {kubeconfig}, {dependsOn: cluster});

// Create apps namespace for developers.
const appsNamespace = new k8s.core.v1.Namespace("apps", undefined, {provider: provider});
export const appsNamespaceName = appsNamespace.metadata.name;

//============================================================================== 
/*
 * Berglas is a tool to manage secrets in GCP Secret Manager or GCP Cloud Storage.
 *
//============================================================================== 

/*
 * Berglas is used as a k8s admission controller to mutate pods to include the 
 * berglas tool as an initContainer, and use Berglas as the required entrypoint.
 *
 * Berglas is setup using:
 * - GCP Cloud Function: serves mutation webhook handler in ./berglas-webhook.
 * - Kubernetes mutation webhook: points to Cloud Function endpoint, and is used
 * to mutate the Pod.
 */

const berglas = new secrets.Berglas("berglas", {
    namespace: appsNamespaceName,
    project: config.gcpProject,
    provider,
}, {dependsOn: cluster});

export const berglasWebhookEndpoint = berglas.endpoint;
export const k8sBerglasServiceAccountName = berglas.k8sBerglasServiceAccount.metadata.name;

//==============================================================================
/*
 * Strimzi Kafka Operator
 */
//==============================================================================

// Install Strimzi Operator v0.18.0.
const strimzi = new streaming.Strimzi("strimzi", {
    provider,
}, {dependsOn: [cluster]});

export const kafkaEndpoint = strimzi.bootstrapEndpoint;

//============================================================================== 
/*
 * Istio and Knative
 */
//============================================================================== 

// Install Istio v1.5.4 from knative/serving/third_party that works with Knative v0.15.
// Using GKE's Istio addon causes issues with Knative Eventing. It is suggested
// to use the Isto reference included in knative/serving.
// See https://github.com/knative/eventing/issues/2266
const istio = new knative.Istio("istio", {
    provider,
}, {dependsOn: cluster});
export const istioDomain = pulumi.interpolate`${istio.externalIp}.xip.io`

// Install Knative v0.15.
const kn = new knative.Knative("knative", {
	istioDomain,
    servingNamespace: "knative-serving",
    eventingNamespace: "knative-eventing",
    provider,
}, {dependsOn: [cluster, istio]});

//==============================================================================
/*
 * Tekton CI/CD
 */
//==============================================================================

// Install Tekton Operator v0.13.0.
const tekton = new cicd.Tekton("tekton", {
    provider,
}, {dependsOn: [cluster]});
