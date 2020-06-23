# GKE, Pulumi, and Knative.
Deploys a Kubernetes cluster on GKE and installs the following technologies to
demo a serverless streaming application.

- GKE - k8s cluster on GCP.
- [Istio](https://knative.dev/docs/install/installing-istio) - service mesh required by Knative.
- [Knative Serving](https://github.com/knative/serving) - used to manage the serverless applications.
- [Knative Eventing](https://github.com/knative/eventing) - used to manage the serverless eventing.
- [Berglas](https://github.com/GoogleCloudPlatform/berglas) - an open source Key Management System (KMS) tool.
- [Strimzi](https://strimzi.io/) - open source Kafka operator.
- [Tekton](http://tekton.dev/) - native k8s ci/cd

The Pulumi program entrypoint is [index.ts](./index.ts)

## Pulumi Requirements

1. [Ensure you have the latest Node.js and NPM](https://nodejs.org/en/download/)
1. [Install the Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
1. [Configure Pulumi to access your GCP account](https://www.pulumi.com/docs/intro/cloud-providers/gcp/setup/)

## Initialize the Pulumi Project

1.  Clone the repo:

    ```bash
    git clone https://github.com/metral/cncf-gke-pulumi
	cd cncf-gke-pulumi
    ```

1.  Install the dependencies.

    ```bash
    npm install
    ```

1.  Create a new Pulumi [stack][stack] named `dev`.

    ```bash
    pulumi stack init dev
    ```

1. Set the Pulumi [configuration][pulumi-config] variables for the project.

    > **Note:** Select any valid Kubernetes regions for the providers.

    ```bash
    pulumi config set gcp:zone <your-zone>	 // e.g. us-west1-a 
    pulumi config set gcp:project <your-project-id>
    ```

## Deploy the Stack

Create the cluster and deploy the workloads by running an update.

### Run an Update

```bash
pulumi up
```

The update takes 5-7 minutes.

Once the update is complete, you'll see output similar to the following. Notice
the stack Outputs which encompass exported values for users to use or for other
Pulumi stacks to reference and consume.

```bash

Updating (dev):
     Type                                                                          Name                                               Status
 +   pulumi:pulumi:Stack                                                           cncf-gke-pulumi-dev                                created
 +   ├─ gcp:storage:Bucket                                                         berglas                                            created
 +   ├─ random:index:RandomString                                                  berglasAccountIdSuffix                             created
 +   ├─ random:index:RandomPassword                                                cncf-gke-pulumi-password                           created
 +   ├─ gcp:serviceAccount:Account                                                 berglas-sa                                         created
 +   ├─ gcp:container:Cluster                                                      cncf-gke-pulumi                                    created
 +   ├─ gcp:storage:BucketObject                                                   go-zip                                             created
 +   ├─ gcp:cloudfunctions:Function                                                berglas                                            created
 +   ├─ gcp:projects:IAMBinding                                                    berglas-iam-0                                      created
 +   ├─ kubernetes:yaml:ConfigFile                                                 knative-operator                                   created
 +   │  ├─ kubernetes:core:ServiceAccount                                          kube-system/knative-operator                       created
 +   │  ├─ kubernetes:core:ConfigMap                                               kube-system/config-logging                         created
 +   │  ├─ kubernetes:core:ConfigMap                                               kube-system/config-observability                   created
 +   │  ├─ kubernetes:rbac.authorization.k8s.io:ClusterRole                        knative-eventing-operator                          created
 +   │  ├─ kubernetes:rbac.authorization.k8s.io:ClusterRole                        knative-serving-operator                           created
 +   │  ├─ kubernetes:apiextensions.k8s.io:CustomResourceDefinition                knativeservings.operator.knative.dev               created
 +   │  ├─ kubernetes:rbac.authorization.k8s.io:ClusterRoleBinding                 knative-serving-operator                           created
 +   │  ├─ kubernetes:apiextensions.k8s.io:CustomResourceDefinition                knativeeventings.operator.knative.dev              created
 +   │  ├─ kubernetes:rbac.authorization.k8s.io:ClusterRole                        knative-serving-operator-aggregated                created
 +   │  ├─ kubernetes:rbac.authorization.k8s.io:ClusterRole                        knative-eventing-operator-aggregated               created
 +   │  ├─ kubernetes:rbac.authorization.k8s.io:ClusterRoleBinding                 knative-serving-operator-aggregated                created
 +   │  ├─ kubernetes:core:ConfigMap                                               kube-system/config-observability                   created
 +   │  ├─ kubernetes:rbac.authorization.k8s.io:ClusterRoleBinding                 knative-eventing-operator-aggregated               created
 +   │  └─ kubernetes:apps:Deployment                                              kube-system/knative-operator                       created
 +   │  └─ kubernetes:apps:Deployment                                              kube-system/knative-operator                       created
 +   │  ├─ kubernetes:rbac.authorization.k8s.io:Role                               istio-system/istio-ingressgateway-sds              created
 +   │  ├─ kubernetes:networking.istio.io:Gateway                                  istio-system/istio-ingressgateway                  created
 +   │  ├─ kubernetes:networking.istio.io:Gateway                                  istio-system/cluster-local-gateway                 created
 +   │  ├─ kubernetes:core:ServiceAccount                                          istio-system/istio-pilot-service-account           created
 +   │  ├─ kubernetes:core:Service                                                 istio-system/istiod                                created
...
 +   ├─ berglas                                                                    berglas                                            created
 +   ├─ knative                                                                    knative                                            created
 +   ├─ kubernetes:yaml:ConfigFile                                                 istio-crds                                         created
 +   │  ├─ kubernetes:core:Namespace                                               istio-system                                       created
 +   │  ├─ kubernetes:core:ServiceAccount                                          istio-system/istio-reader-service-account          created
 +   │  ├─ kubernetes:apiextensions.k8s.io:CustomResourceDefinition                httpapispecs.config.istio.io                       created
 +   │  ├─ kubernetes:apiextensions.k8s.io:CustomResourceDefinition                adapters.config.istio.io                           created
 +   │  ├─ kubernetes:apiextensions.k8s.io:CustomResourceDefinition                templates.config.istio.io                          created

Outputs:
    appsNamespaceName           : "apps-0gcziryf"
    berglasWebhookEndpoint      : "https://us-central1-pulumi-development.cloudfunctions.net/berglas-0553f78"
    clusterName                 : "cncf-gke-pulumi-3fa1dd0"
    istioDomain                 : "35.230.107.2.xip.io"
    k8sBerglasServiceAccountName: "berglas-0wmpoog6"
	kafkaEndpoint               : 10.31.245.240
    kubeconfig                  : "[secret]"

Resources:
    + 102 created

Duration: 5m6s

Permalink: https://app.pulumi.com/metral/cncf-gke-pulumi/dev/updates/1
```

### Use the GKE cluster and verify it's up

Using the `kubeconfig` stack output, we can verify the cluster and Pods are up
and running:

```bash
pulumi stack output --show-secrets kubeconfig > kubeconfig.json
export KUBECONFIG=`pwd`/kubeconfig.json

kubectl get nodes -o wide --show-labels
kubectl get pods --all-namespaces -o wide --show-labels
```

### Verify Knative is running

Verify that Knative Serving and Eventing are up and running.

```bash
$ kubectl get KnativeServing -n knative-serving
NAME                       VERSION   READY   REASON
knative-serving-xm47ifqm   0.15.0    True

$ kubectl get KnativeEventing -n knative-eventing
NAME                        VERSION   READY   REASON
knative-eventing-k96ss456   0.15.0    True
```

### Knative DNS

By default, TLS/SSL certificates for an HTTPS Knative endpoint is not enabled 
in this stack to simplify setup for demos and development.

To properly route public Internet clients to the serverless apps, we'll need to
manually patch the Knative Serving domain to use free, wildcard DNS management
for development purposes only.

We'll use the `istioDomain` stack output to setup DNS for the public IP of the
Istio ingress LoadBalancer.

See [Configuring DNS for Knative and Istio][knative-istio-configure-dns] for
more details on Istio setup.

> Note: a manual patch is used as a workaround to modify the existing Istio
config-domain ConfigMap. See https://github.com/pulumi/pulumi-kubernetes/issues/264

```bash
echo "'{\"data\":{ \"$(pulumi stack output istioDomain)\": \"\"}}'" | xargs kubectl patch cm config-domain -n knative-serving  --patch
```

With this update, Knative ingress will use a domain like `35.233.169.211.xip.io`
to point to the IP of its LoadBalancer `35.233.169.211`.

## Examples

### Run an example container on Knative 

Run a simple hello world serverless example.

```bash
kubectl apply -f example-knative-go-app/service.yaml -n `pulumi stack output appsNamespaceName`
```

After a few seconds, check the serverless service and ingress status.

```bash
$ kubectl get king -n `pulumi stack output appsNamespaceName`
NAME            READY   REASON
helloworld-go   True

$ kubectl get ksvc -n `pulumi stack output appsNamespaceName`
NAME            URL                                                        LATESTCREATED         LATESTREADY           READY   REASON
helloworld-go   http://helloworld-go.apps-1ovyw1z8.35.233.169.211.xip.io   helloworld-go-k78lt   helloworld-go-k78lt   True
```

Curl the endpoint.

```bash
$ curl http://helloworld-go.apps-1ovyw1z8.35.233.169.211.xip.io

Hello Go Sample v1!
```

Delete the hello world serverless example.

```bash
kubectl delete -f example-knative-go-app/service.yaml -n `pulumi stack output appsNamespaceName`
```

### Run an example container on Knative that uses Berglas

By default, TLS/SSL certificates for an HTTPS Knative endpoint is not enabled 
in this stack to simplify setup for demos and development.

This means that we'll deploy the Beglas mutating webhook using GCP Cloud Functions, 
as Berglas [requires TLS][berglas-tls] and Cloud Function endpoints use it. Once deployed, 
we'll set the public endpoint of the function in the Kubernetes mutating webhook
created by the stack for Kubernetes to use during Pod admission.

View the Kubernetes mutating webhook created by the stack.

```bash
$ kubectl get mutatingwebhookconfigurations.admissionregistration.k8s.io
NAME                                                 CREATED AT
berglas-6xyljvxm                                     2020-06-16T01:27:33Z
istio-sidecar-injector                               2020-06-16T01:16:33Z
pod-ready.config.common-webhooks.networking.gke.io   2020-06-16T01:15:41Z
sinkbindings.webhook.sources.knative.dev             2020-06-16T01:27:48Z
webhook.eventing.knative.dev                         2020-06-16T01:27:47Z
webhook.istio.networking.internal.knative.dev        2020-06-16T01:27:45Z
webhook.serving.knative.dev                          2020-06-16T01:27:43Z
```

View the Berglas Kubernetes Service Account (KSA) created. Note the annotation
that binds the KSA to the GCP Service Account (GSA) to access GCP Secret Manager secrets.

Note down the KSA's name to use in an example.

```bash
$ kubectl get serviceaccounts -n `pulumi stack output appsNamespaceName`
NAME               SECRETS   AGE
berglas-5g6cgogp   1         39m
default            1         39m
```

```bash
$ kubectl get serviceaccounts berglas-5g6cgogp -n `pulumi stack output appsNamespaceName` -o yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  annotations:
    iam.gke.io/gcp-service-account: berglas-ejlg8px@pulumi-development.iam.gserviceaccount.com
	...
  creationTimestamp: "2020-06-16T01:17:06Z"
  labels:
    app.kubernetes.io/managed-by: pulumi
  name: berglas-5g6cgogp
  namespace: apps-1ovyw1z8
  ...
secrets:
- name: berglas-5g6cgogp-token-wr2tp
```

Deploy a Berglas Pod that accesses an existing secret in GCP
Secrets Manager (GSM) using the `berglas-5g6cgogp` KSA.

```bash
cat > envserver.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: envserver
spec:
  replicas: 1
  selector:
    matchLabels:
      app: envserver
  template:
    metadata:
      labels:
        app: envserver
    spec:
      serviceAccountName: berglas-5g6cgogp
      containers:
      - name: envserver
        image: sethvargo/envserver
        imagePullPolicy: Always
        command: ["/bin/envserver"]
        env:
        # This is an example using Berglas with Secret Manager storage.
        - name: API_KEY
          value: sm://<your-gcp-project-id>/<your-gsm-secret>#<version>

---
apiVersion: v1
kind: Service
metadata:
  name: envserver
  labels:
    app: envserver
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: envserver
EOF
```

Edit the `serviceAccountName` to the `berglas` KSA, and `API_KEY` value to use
the berglas GSM syntax to point to an existing secret.

Deploy the Berglas example.

```bash
kubectl apply -f envserver.yaml -n `pulumi stack output appsNamespaceName`
```

Get the endpoint of the Berglas Service LoadBalancer to query and view that
Berglas is in fact retrieving secrets and setting them appropriately.

```bash
kubectl get svc envserver -n `pulumi stack output appsNamespaceName`

NAME        TYPE           CLUSTER-IP     EXTERNAL-IP     PORT(S)        AGE
envserver   LoadBalancer   10.27.254.36   34.82.223.185   80:32016/TCP   111s
```

Curl the `envserver` Service LoadBalancer endpoint, and notice the `API_KEY` was
interpolated and set in the environment variable with the proper GCP Secrets
Manager secret value.

```bash
curl -s http://34.82.223.185/ | python -mjson.tool

{
    "API_KEY": "foo123",
    "ENVSERVER_PORT": "tcp://10.59.248.8:80",
    "ENVSERVER_PORT_80_TCP": "tcp://10.59.248.8:80",
    "ENVSERVER_PORT_80_TCP_ADDR": "10.59.248.8",
    "ENVSERVER_PORT_80_TCP_PORT": "80",
    "ENVSERVER_PORT_80_TCP_PROTO": "tcp",
    "ENVSERVER_SERVICE_HOST": "10.59.248.8",
    "ENVSERVER_SERVICE_PORT": "80",
    "HOME": "/home/appuser",
    "HOSTNAME": "envserver-69f9774b4d-v5fz4",
    "KUBERNETES_PORT": "tcp://10.59.240.1:443",
    "KUBERNETES_PORT_443_TCP": "tcp://10.59.240.1:443",
    "KUBERNETES_PORT_443_TCP_ADDR": "10.59.240.1",
    "KUBERNETES_PORT_443_TCP_PORT": "443",
    "KUBERNETES_PORT_443_TCP_PROTO": "tcp",
    "KUBERNETES_SERVICE_HOST": "10.59.240.1",
    "KUBERNETES_SERVICE_PORT": "443",
    "KUBERNETES_SERVICE_PORT_HTTPS": "443",
    "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
}
```

Delete the Berglas example.

```bash
kubectl delete -f envserver.yaml -n `pulumi stack output appsNamespaceName`
```

### Run a Strimzi example

View the Pods are running in the `kafka` namespace

```bash
$ kubectl get pods,svc -n kafka -o wide
NAME                                                          READY   STATUS    RESTARTS   AGE   IP           NODE                                                  NOMINATED NODE   READINESS GATES
pod/kafka-cluster-m3hi73ku-entity-operator-789c49c7f6-lfdcv   3/3     Running   0          21h   10.28.1.9    gke-cncf-gke-pulumi-3fa1-default-pool-6b9a2d5f-tkg5   <none>           <none>
pod/kafka-cluster-m3hi73ku-kafka-0                            2/2     Running   0          21h   10.28.1.8    gke-cncf-gke-pulumi-3fa1-default-pool-6b9a2d5f-tkg5   <none>           <none>
pod/kafka-cluster-m3hi73ku-zookeeper-0                        1/1     Running   0          21h   10.28.2.13   gke-cncf-gke-pulumi-3fa1-default-pool-6b9a2d5f-8zwn   <none>           <none>
pod/strimzi-cluster-operator-6c9d899778-dkh2b                 1/1     Running   0          21h   10.28.0.17   gke-cncf-gke-pulumi-3fa1-default-pool-6b9a2d5f-7r9p   <none>           <none>

NAME                                              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE   SELECTOR
service/kafka-cluster-m3hi73ku-kafka-bootstrap    ClusterIP   10.31.245.240   <none>        9091/TCP,9092/TCP,9093/TCP   21h   strimzi.io/cluster=kafka-cluster-m3hi73ku,strimzi.io/kind=Kafka,strimzi.io/name=kafka-cluster-m3hi73ku-kafka
service/kafka-cluster-m3hi73ku-kafka-brokers      ClusterIP   None            <none>        9091/TCP,9092/TCP,9093/TCP   21h   strimzi.io/cluster=kafka-cluster-m3hi73ku,strimzi.io/kind=Kafka,strimzi.io/name=kafka-cluster-m3hi73ku-kafka
service/kafka-cluster-m3hi73ku-zookeeper-client   ClusterIP   10.31.242.114   <none>        2181/TCP                     21h   strimzi.io/cluster=kafka-cluster-m3hi73ku,strimzi.io/kind=Kafka,strimzi.io/name=kafka-cluster-m3hi73ku-zookeeper
service/kafka-cluster-m3hi73ku-zookeeper-nodes    ClusterIP   None            <none>        2181/TCP,2888/TCP,3888/TCP   21h   strimzi.io/cluster=kafka-cluster-m3hi73ku,strimzi.io/kind=Kafka,strimzi.io/name=kafka-cluster-m3hi73ku-zookeeper
```

Start an example Producer. Once running, in the command prompt type a message e.g. 'hello world'

```bash
kubectl -n kafka run kafka-producer -ti --image=strimzi/kafka:0.18.0-kafka-2.5.0 --rm=true --restart=Never -- bin/kafka-console-producer.sh --broker-list `pulumi stack output kafkaEndpoint`:9092 --topic my-topic
```

Start an example Consumer. Messages from the producer should appear.

```bash
kubectl -n kafka run kafka-consumer -ti --image=strimzi/kafka:0.18.0-kafka-2.5.0 --rm=true --restart=Never -- bin/kafka-console-consumer.sh --bootstrap-server `pulumi stack output kafkaEndpoint`:9092 --topic my-topic --from-beginning
```

### Run a Tekton example

```bash
cat > tekton-pipeline.yaml << EOF
apiVersion: operator.tekton.dev/v1alpha1
kind: TektonPipeline
metadata:
  name: cluster
spec:
  targetNamespace: tekton-pipelines
EOF
```

Create the Tektoon Pipeline CustomResource and get it's status.

```bash
kubectl apply -f tekton-pipeline.yaml
kubectl get tektonpipelines.operator.tekton.dev
NAME      STATUS
cluster   installed
```

Delete the Pipeline.

```bash
kubectl delete -f tekton-pipeline.yaml
```

## Clean Up

Run the following command to tear down the resources that are part of our
stack.

1. Run `pulumi destroy` to tear down all resources.  You'll be prompted to make
   sure you really want to delete these resources.

   ```bash
   pulumi destroy
   ```

1. To delete the stack, run the following command.

   ```bash
   pulumi stack rm
   ```
   > **Note:** This command deletes all deployment history from the Pulumi
   > Console and cannot be undone.

[stack]: https://www.pulumi.com/docs/reference/stack.md"
[pulumi-config]: https://www.pulumi.com/docs/reference/config"
[knative-istio-configure-dns]: https://knative.dev/docs/install/installing-istio/#configuring-dns
[berglas-tls]: https://github.com/GoogleCloudPlatform/berglas/tree/master/examples/kubernetes
