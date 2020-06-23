import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

/*
 * StrimziArgs is the options to configure and deploy Strimzi as a Kubernetes
 * Operator.
 */
export interface StrimziArgs {
    // The k8s provider used to create Strimzi.
    provider: k8s.Provider;
}

/*
 * Strimzi configures and deploys the Strimzi Kafka Operator on Kubernetes.
 */
export class Strimzi extends pulumi.ComponentResource {
    public readonly bootstrapEndpoint: pulumi.Output<string>;
    constructor(name: string,
        args: StrimziArgs,
        opts: pulumi.ComponentResourceOptions) {
        super("strimzi", name, args, opts);

        // Install Strimzi.
        const kafkaNamespace = new k8s.core.v1.Namespace("kafka",
            {metadata: {name: "kafka"}
            }, {provider: args.provider, dependsOn: opts.dependsOn});

        const strimzi = new k8s.yaml.ConfigFile("strimzi-operator", {
            file: "manifests/strimzi-operator/strimzi-operator.yaml"
        }, {provider: args.provider, dependsOn: [kafkaNamespace]});

        const kafkaCluster = new k8s.apiextensions.CustomResource('kafka-cluster', {
            apiVersion: "kafka.strimzi.io/v1beta1",
            metadata: {namespace: kafkaNamespace.metadata.name},
            kind: "Kafka",
            spec: {
                kafka: {
                    version: "2.5.0",
                    replicas: 1,
                    listeners: {
                        plain: {},
                        tls: {}
                    },
                    config: {
                        "offsets.topic.replication.factor": 1,
                        "transaction.state.log.replication.factor": 1,
                        "transaction.state.log.min.isr": 1,
                        "log.message.format.version": "2.5"
                    },
                    storage: {
                        type: "jbod",
                        volumes: [{
                            id: 0,
                            type: "persistent-claim",
                            size: "100Gi",
                            deleteClaim: false
                        }]
                    }
                },
                zookeeper: {
                    replicas: 1,
                    storage: {
                        type: "persistent-claim",
                        size: "100Gi",
                        deleteClaim: false
                    }
                },
                entityOperator: {
                    "topicOperator": {},
                    "userOperator": {}
                }
            }
        }, {provider: args.provider, dependsOn: strimzi});

        const svc = k8s.core.v1.Service.get("kafka-cluster-bootstrap-svc",
            pulumi.interpolate`${kafkaNamespace.metadata.name}/${kafkaCluster.metadata.name}-kafka-bootstrap`
        , {provider: args.provider, dependsOn: kafkaCluster});

        this.bootstrapEndpoint = svc.spec.clusterIP;
    }
}
