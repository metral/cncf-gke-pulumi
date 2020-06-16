import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface IstioArgs {
	provider: k8s.Provider,
}

export class Istio extends pulumi.ComponentResource {
	public readonly externalIp: pulumi.Output<string>;
	constructor(name: string,
		args: IstioArgs,
		opts: pulumi.ComponentResourceOptions) {
		super("istio", name, args, opts);

        // Install the Istio CRDs first.
		const crds = new k8s.yaml.ConfigFile("istio-crds", {
			file: "manifests/istio/istio-crds.yaml"
		}, {provider: args.provider, dependsOn: opts.dependsOn});

        // Install the minimal install of a default Istio v1.5.4 that works
        // with knative v0.15
		const istio = new k8s.yaml.ConfigFile("istio-minimal", {
			file: "manifests/istio/istio-minimal.yaml"
		}, {provider: args.provider, dependsOn: opts.dependsOn});

        // Get the public LB IP of the knative ingress gateway.
        this.externalIp = istio.getResourceProperty("v1/Service", "istio-system", "istio-ingressgateway", "status").apply(status => status.loadBalancer.ingress[0].ip);
	}
}

export interface KnativeArgs {
    istioDomain: pulumi.Input<string>,
    servingNamespace: pulumi.Input<string>,
    eventingNamespace: pulumi.Input<string>,
	provider: k8s.Provider,
}
export class Knative extends pulumi.ComponentResource {
    constructor(name: string,
        args: KnativeArgs,
        opts: pulumi.ComponentResourceOptions) {
        super("knative", name, args, opts);

        // Install the Knative Operator.
        const knative = new k8s.yaml.ConfigFile("knative-operator", {
            file: "manifests/knative-operator/knative-operator.yaml"
		}, {provider: args.provider, dependsOn: opts.dependsOn});

        // Install the Knative Serving component.
        const knativeServingNamespace = new k8s.core.v1.Namespace("knative-serving",
            {metadata: {name: "knative-serving"}
		}, {provider: args.provider, dependsOn: opts.dependsOn});

        const serving = new k8s.apiextensions.CustomResource('knative-serving', {
            apiVersion: "operator.knative.dev/v1alpha1",
            metadata: {namespace: args.servingNamespace},
            kind: 'KnativeServing',
		}, {provider: args.provider, dependsOn: knative});

        // Install the Knative Eventing component.
        const knativeEventingNamespace = new k8s.core.v1.Namespace("knative-eventing",
            {metadata: {name: "knative-eventing"}
		}, {provider: args.provider, dependsOn: opts.dependsOn});

        const eventing = new k8s.apiextensions.CustomResource('knative-eventing', {
            apiVersion: "operator.knative.dev/v1alpha1",
            metadata: {namespace: args.eventingNamespace},
            kind: 'KnativeEventing',
		}, {provider: args.provider, dependsOn: knative});
    }
}
