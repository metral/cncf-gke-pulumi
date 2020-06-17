The Istio v1.5.4 manifests are derived from Knative Serving:
https://github.com/knative/serving/tree/master/third_party/istio-1.5.4

Using GKE's Istio addon causes issues with Knative Eventing. It is suggested
to use the Isto reference included in knative/serving. See https://github.com/knative/eventing/issues/2266

The manifests here have been commented out where duplicates exist upstream in
Knative between resources and CRDs. Pulumi requires unique resource names, so
the upstream manifests are not usable in Pulumi without commenting out the
duplicates.
