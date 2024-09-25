import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as aws from "@pulumi/aws";
import { tractionEKSCluster } from "./eks"; // Import EKS cluster from eks.ts

/********* Define the Namespace where Tekton will be installed *********/
const tektonNamespace = new k8s.core.v1.Namespace("tektonNamespace", {
    metadata: {
        name: "tekton-pipelines",
    },
}, { provider: tractionEKSCluster.provider });

/********* Wait until the namespace is fully created *********/
const tektonNamespaceReady = tektonNamespace.metadata.name.apply(name => {
    return new k8s.core.v1.Namespace(name, undefined, {
        provider: tractionEKSCluster.provider,
    });
});

/********* Creating Helm Charts to deploy tekton pipelines *********/
const tektonPipelines = new k8s.helm.v3.Chart("tekton-pipelines", {
    chart: "tekton-pipeline",
    version: "0.41.0",
    fetchOpts: {
        repo: "https://tekton-releases.storage.googleapis.com",
    },
    namespace: tektonNamespace.metadata.name,
}, { provider: tractionEKSCluster.provider, dependsOn: tektonNamespace });  

/********* Output the Tekton namespace and Helm chart status *********/
export const tektonNamespaceName = tektonNamespace.metadata.name;
export const tektonChartStatus = tektonPipelines.status;