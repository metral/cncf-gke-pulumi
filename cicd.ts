import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

/*
 * TektonArgs is the options to configure and deploy Tekton as a Kubernetes
 * Operator.
 */
export interface TektonArgs {
	// The k8s provider used to create Tekton.
	provider: k8s.Provider;
}

/*
 * Tekton configures and deploys the Tekton Operator on Kubernetes.
 */
export class Tekton extends pulumi.ComponentResource {
	public readonly bootstrapEndpoint: pulumi.Output<string>;
	constructor(name: string,
		args: TektonArgs,
		opts: pulumi.ComponentResourceOptions) {
		super("tekton", name, args, opts);

		// Install Tekton.
		const tektonNamespace = new k8s.core.v1.Namespace(name,
			{metadata: {name: name}
			}, {provider: args.provider, dependsOn: opts.dependsOn});

		// Install the CRDs first.
		const crdPipelines = new k8s.yaml.ConfigFile("tekton-crd-pipelines", {
			file: "manifests/tekton-operator/crds/operator_v1alpha1_pipeline_crd.yaml"
		}, {provider: args.provider, dependsOn: opts.dependsOn});
		const crdAddons = new k8s.yaml.ConfigFile("tekton-crd-addons", {
			file: "manifests/tekton-operator/crds/operator_v1alpha1_addon_crd.yaml"
		}, {provider: args.provider, dependsOn: opts.dependsOn});

		// Create the service account
		const sa = new k8s.core.v1.ServiceAccount(name, {
			metadata: { namespace: tektonNamespace.metadata.name, },
		}, { provider:args.provider})

		// Create the cluster role
        const clusterRole = new k8s.rbac.v1.ClusterRole(name, {
            "rules": [
                {
                    "apiGroups": [
                        ""
                    ],
                    "resources": [
                        "pods",
                        "services",
                        "endpoints",
                        "persistentvolumeclaims",
                        "events",
                        "configmaps",
                        "secrets",
                        "pods/log",
                        "limitranges"
                    ],
                    "verbs": [
                        "*"
                    ]
                },
                {
                    "apiGroups": [
                        "extensions",
                        "apps"
                    ],
                    "resources": [
                        "ingresses",
                        "ingresses/status"
                    ],
                    "verbs": [
                        "delete",
                        "create",
                        "patch",
                        "get",
                        "list",
                        "update",
                        "watch"
                    ]
                },
                {
                    "apiGroups": [
                        ""
                    ],
                    "resources": [
                        "namespaces"
                    ],
                    "verbs": [
                        "get",
                        "list",
                        "create",
                        "update",
                        "delete",
                        "patch",
                        "watch"
                    ]
                },
                {
                    "apiGroups": [
                        "apps"
                    ],
                    "resources": [
                        "deployments",
                        "daemonsets",
                        "replicasets",
                        "statefulsets",
                        "deployments/finalizers"
                    ],
                    "verbs": [
                        "*"
                    ]
                },
                {
                    "apiGroups": [
                        "monitoring.coreos.com"
                    ],
                    "resources": [
                        "servicemonitors"
                    ],
                    "verbs": [
                        "get",
                        "create",
                        "delete"
                    ]
                },
                {
                    "apiGroups": [
                        "rbac.authorization.k8s.io"
                    ],
                    "resources": [
                        "clusterroles",
                        "roles"
                    ],
                    "verbs": [
                        "get",
                        "create",
                        "update",
                        "delete"
                    ]
                },
                {
                    "apiGroups": [
                        ""
                    ],
                    "resources": [
                        "serviceaccounts"
                    ],
                    "verbs": [
                        "get",
                        "list",
                        "create",
                        "update",
                        "delete",
                        "patch",
                        "watch"
                    ]
                },
                {
                    "apiGroups": [
                        "rbac.authorization.k8s.io"
                    ],
                    "resources": [
                        "clusterrolebindings",
                        "rolebindings"
                    ],
                    "verbs": [
                        "get",
                        "create",
                        "update",
                        "delete"
                    ]
                },
                {
                    "apiGroups": [
                        "apiextensions.k8s.io"
                    ],
                    "resources": [
                        "customresourcedefinitions",
                        "customresourcedefinitions/status"
                    ],
                    "verbs": [
                        "get",
                        "create",
                        "update",
                        "delete",
                        "list",
                        "patch",
                        "watch"
                    ]
                },
                {
                    "apiGroups": [
                        "admissionregistration.k8s.io"
                    ],
                    "resources": [
                        "mutatingwebhookconfigurations",
                        "validatingwebhookconfigurations"
                    ],
                    "verbs": [
                        "get",
                        "list",
                        "create",
                        "update",
                        "delete",
                        "patch",
                        "watch"
                    ]
                },
                {
                    "apiGroups": [
                        "build.knative.dev"
                    ],
                    "resources": [
                        "builds",
                        "buildtemplates",
                        "clusterbuildtemplates"
                    ],
                    "verbs": [
                        "get",
                        "list",
                        "create",
                        "update",
                        "delete",
                        "patch",
                        "watch"
                    ]
                },
                {
                    "apiGroups": [
                        "extensions"
                    ],
                    "resources": [
                        "deployments"
                    ],
                    "verbs": [
                        "get",
                        "list",
                        "create",
                        "update",
                        "delete",
                        "patch",
                        "watch"
                    ]
                },
                {
                    "apiGroups": [
                        "extensions"
                    ],
                    "resources": [
                        "deployments/finalizers"
                    ],
                    "verbs": [
                        "get",
                        "list",
                        "create",
                        "update",
                        "delete",
                        "patch",
                        "watch"
                    ]
                },
                {
                    "apiGroups": [
                        "policy"
                    ],
                    "resources": [
                        "podsecuritypolicies"
                    ],
                    "verbs": [
                        "get",
                        "create",
                        "update",
                        "delete",
                        "use"
                    ]
                },
                {
                    "apiGroups": [
                        "operator.tekton.dev"
                    ],
                    "resources": [
                        "*",
                        "tektonaddons"
                    ],
                    "verbs": [
                        "*"
                    ]
                },
                {
                    "apiGroups": [
                        "tekton.dev",
                        "triggers.tekton.dev"
                    ],
                    "resources": [
                        "*"
                    ],
                    "verbs": [
                        "*"
                    ]
                },
                {
                    "apiGroups": [
                        "dashboard.tekton.dev"
                    ],
                    "resources": [
                        "*",
                        "tektonaddons"
                    ],
                    "verbs": [
                        "*"
                    ]
                },
                {
                    "apiGroups": [
                        "security.openshift.io"
                    ],
                    "resources": [
                        "securitycontextconstraints"
                    ],
                    "verbs": [
                        "use"
                    ]
                },
                {
                    "apiGroups": [
                        "route.openshift.io"
                    ],
                    "resources": [
                        "routes"
                    ],
                    "verbs": [
                        "get",
                        "list"
                    ]
                }
            ]
        }, { provider:args.provider})

		const roleBinding = new k8s.rbac.v1.ClusterRoleBinding(name, {
			"kind": "ClusterRoleBinding",
			"subjects": [
				{
					"kind": "ServiceAccount",
					"name": sa.metadata.name,
					"namespace": tektonNamespace.metadata.name,
				}
			],
			"roleRef": {
				"kind": "ClusterRole",
				"name": clusterRole.metadata.name,
				"apiGroup": "rbac.authorization.k8s.io"
			}
		}, { provider:args.provider})

        // Deploy the Operator
        const deploy = new k8s.apps.v1.Deployment(name, {
            metadata: { namespace: tektonNamespace.metadata.name },
            "spec": {
                "replicas": 1,
                "selector": {
                    "matchLabels": {
                        "name": name
                    }
                },
                "template": {
                    "metadata": {
                        "labels": {
                            "name": name
                        }
                    },
                    "spec": {
                        "serviceAccountName": sa.metadata.name,
                        "containers": [
                            {
                                "name": name,
                                "image": "metral/tekton-operator:v0.13.0",
                                "command": [
                                    "tekton-operator"
                                ],
                                "imagePullPolicy": "Always",
                                "env": [
                                    {
                                        "name": "WATCH_NAMESPACE",
                                        "value": ""
                                    },
                                    {
                                        "name": "POD_NAME",
                                        "valueFrom": {
                                            "fieldRef": {
                                                "fieldPath": "metadata.name"
                                            }
                                        }
                                    },
                                    {
                                        "name": "OPERATOR_NAME",
                                        "valueFrom": {
                                            "fieldRef": {
                                                "fieldPath": "metadata.name"
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
		}, { provider:args.provider})
	}
}
