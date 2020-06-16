import { asset } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import * as rand from "@pulumi/random";
import * as utils from "./utils";

/*
 * Berglas is a tool to manage secrets in GCP Secret Manager or GCP Cloud Storage.
 *
 * Berglas is setup by creating the following resources.
 *
 * Permissions:
 * - GCP Service Account (GSA) with permissions to access GCP Secret Manager (GSM) secrets.
 * - Kubernetes Service Account (KSA) bound to use the GSA to access GSM
 *
 * Infrastructure:
 * - GCP Cloud Function: serves mutation webhook handler in ./berglas-webhook
 * - Kubernetes mutation webhook: admission controller to mutate pods to
 * include Berglas as an initContainer, and use Berglas as the required entrypoint.
 *
 * For details on Berglas see:
 *  - https://github.com/GoogleCloudPlatform/berglas/tree/master/examples/kubernetes#setup-and-usage
 *  - https://github.com/GoogleCloudPlatform/berglas/issues/109#issuecomment-601209844
 */

/*
 * BerglasArgs is the options to configure and deploy Berglas as a GCP Cloud
 * Function, and use its endpoint as a Kubernetes mutating webhook to work with
 * GSM.
 */
export interface BerglasArgs {
    // GCP project used for the GKE cluster. Used for configuring Kubernetes
    // Service Accounts to use GCP Service Accounts.
	project: pulumi.Input<string>;
    // Namespace used to create the 'berglas' KSA that will be used by Pods in
    // the same namespace that intend to work with GSM. The KSA is bound to
    // the GSA that can access GSM.
    namespace: pulumi.Input<string>;
    // The k8s provider used to create the KSA.
    provider: k8s.Provider;
}

/*
 * Berglas configures and deploy Berglas as a GCP Cloud Function, and uses its
 * endpoint as a Kubernetes mutating webhook for Pods to work with GSM.
 */
export class Berglas extends pulumi.ComponentResource {
    public readonly endpoint: pulumi.Output<string>;
    public readonly k8sBerglasServiceAccount: k8s.core.v1.ServiceAccount;
    constructor(name: string,
        args: BerglasArgs,
        opts: pulumi.ComponentResourceOptions) {
        super("berglas", name, args, opts);

        // Create a GCP ServiceAccount for Berglas k8s webhook to work with GCP Secret Manager.
        const berglasAccountIdSuffix = new rand.RandomString("berglasAccountIdSuffix", {
            length: 7,
            special: false,
            upper: false,
        }).result;
        const gcpBerglasServiceAccount = new gcp.serviceAccount.Account(`${name}-sa`, {
            project: args.project,
            accountId: pulumi.interpolate`${name}-${berglasAccountIdSuffix}`,
            displayName: "Kubernetes Berglas",
        });

        // Bind the Berglas GCP ServiceAccount to the required roles.
        const berglasIamBindings = utils.bindGcpSaToRole(`${name}`, {
            serviceAccount: gcpBerglasServiceAccount,
            project: args.project,
            // See for GCP authorization options to use with Berglas:
            // https://github.com/GoogleCloudPlatform/berglas#authorization
            roles: [
                "roles/secretmanager.secretAccessor"    // Access GCP Secret Manager secrets.
            ]
        });

        // Create a k8s ServiceAccount for the apps namespace users to use the
        // Berglas GCP ServiceAccount and access GCP Secret Manager secrets.
        this.k8sBerglasServiceAccount = new k8s.core.v1.ServiceAccount(name, {
            metadata: {
                namespace: args.namespace,
                annotations: {
                    "iam.gke.io/gcp-service-account": gcpBerglasServiceAccount.email,
                },
            },
		}, {provider: args.provider, dependsOn: opts.dependsOn});

        // Bind the Berglas k8s ServiceAccount to use the Berglas GCP ServiceAccount.
        const berglasGcpToK8sIamBinding = utils.bindK8sSaToGcpSa(`${name}`, {
            gcpProject: args.project,
            k8sServiceAccount: this.k8sBerglasServiceAccount,
            gcpServiceAccount: gcpBerglasServiceAccount,
        });

        // Deploy the Berglass webhook to GCP Cloud Functions.

        // Create a GCS Bucket for the Go src.
        const bucket = new gcp.storage.Bucket(name);
        const bucketObjectGo = new gcp.storage.BucketObject("go-zip", {
            bucket: bucket.name,
            source: new asset.AssetArchive({
                ".": new asset.FileArchive("./berglas-webhook"),
            }),
        });

        // Create the function that the webhook will run.
        const functionGo = new gcp.cloudfunctions.Function(name, {
            sourceArchiveBucket: bucket.name,
            runtime: "go111",
            sourceArchiveObject: bucketObjectGo.name,
            entryPoint: "F",
            triggerHttp: true,
            availableMemoryMb: 128,
            region: "us-central1",
        });

        // Invoke the webhook.
        const goInvoker = new gcp.cloudfunctions.FunctionIamMember(`${name}-gcpfunc`, {
            project: functionGo.project,
            region: functionGo.region,
            cloudFunction: functionGo.name,
            role: "roles/cloudfunctions.invoker",
            member: "allUsers",
        });

        // Get the berglas Cloud Function URL.
        this.endpoint = functionGo.httpsTriggerUrl;

        // Create a mutating webhook admission controller using the berglas
        // webhook endpoint.
        const webhook = new k8s.admissionregistration.v1beta1.MutatingWebhookConfiguration(name, {
            metadata: {
                namespace: args.namespace,
                annotations: {
                    "iam.gke.io/gcp-service-account": gcpBerglasServiceAccount.email,
                },
            },
            webhooks: [{
                admissionReviewVersions: ["v1beta1"],
                name: `${name}-webhook.cloud.google.com`,
                clientConfig: {
                    url: this.endpoint,
                    caBundle: "",
                },
                rules: [{
                    operations: ["CREATE"],
                    apiGroups: [""],
                    apiVersions: ["v1"],
                    resources: ["pods"],
                    scope: "Namespaced",
                }],
                sideEffects: "None",
            }],
		}, {provider: args.provider, dependsOn: opts.dependsOn});
    }
}
