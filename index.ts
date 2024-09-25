import * as pulumi from "@pulumi/pulumi";
import * as vpc from "./vpc";
import * as eks from "./eks";
import * as aws from "@pulumi/aws";
import * as tekton from "./tekton.ts"

export const vpcId = vpc.tractionEksVPC.id;
export const publicSubnets = [vpc.tractionEksPublicSubnetA.id, vpc.tractionEksPublicSubnetB.id];
export const privateSubnets = [vpc.tractionEksPrivateSubnetA.id, vpc.tractionEksPrivateSubnetB.id];
export const eksClusterName = eks.eksClusterName;
export const nodegroup = eks.nodeGroupName;
export const tektonNamespaceName = tekton.tektonNamespaceName;
export const tektonChartStatus = tekton.tektonChartStatus;
