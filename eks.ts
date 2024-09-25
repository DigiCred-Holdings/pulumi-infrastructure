import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as vpc from "./vpc";
import * as eks from "@pulumi/eks";

/********* Create the EKS cluster from the pulumi/eks module *********/
export const tractionEKSCluster = new eks.Cluster("tractionEKSCluster", {
    vpcId: vpc.tractionEksVPC.id,
    publicSubnetIds: [vpc.tractionEksPublicSubnetA.id, vpc.tractionEksPublicSubnetB.id],
    privateSubnetIds: [vpc.tractionEksPrivateSubnetA.id, vpc.tractionEksPrivateSubnetB.id],
    skipDefaultNodeGroup: true,
    tags: {
        Name: "tractionEKSCluster"
    },
});

/********* Create launchTemplate for the nodeGroup *********/
const tractionEKSClusterLaunchTemplate = new aws.ec2.LaunchTemplate("tractionEKSClusterLaunchTemplate", {
    instanceType: "t3.large",
    namePrefix: "tractionEKSClusterNode",
    tagSpecifications: [{
        resourceType: "instance",
        tags: {
            Name: "tractionEKSClusterNode",
        },
    }],
});

/********* Create managed nodegroup, its IAM role, its policies for the above created EKS cluster *********/
//IAM role
const tractionEKSnodeIAMrole = new aws.iam.Role("tractionEKSnodeIAMrole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "ec2.amazonaws.com",
    }),
});

//policies for IAM role
new aws.iam.RolePolicyAttachment("AmazonEKSWorkerNodePolicy", {
    role: tractionEKSnodeIAMrole,
    policyArn: "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
});

new aws.iam.RolePolicyAttachment("AmazonEC2ContainerRegistryReadOnly", {
    role: tractionEKSnodeIAMrole,
    policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
});

new aws.iam.RolePolicyAttachment("AmazonEKS_CNI_Policy", {
    role: tractionEKSnodeIAMrole,
    policyArn: "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
});

//managed nodegroup
const tractionEKSClusterNG = new aws.eks.NodeGroup("tractionEKSClusterNG", {
    clusterName: tractionEKSCluster.eksCluster.name,
    nodeRoleArn: tractionEKSnodeIAMrole.arn,
    subnetIds: [vpc.tractionEksPrivateSubnetA.id, vpc.tractionEksPrivateSubnetB.id ],
    scalingConfig: {
        desiredSize: 3,
        maxSize: 4,
        minSize: 2,
    },
    nodeGroupName: "tractionEKSClusterNG",
    launchTemplate: {
        id: tractionEKSClusterLaunchTemplate.id,
        version: tractionEKSClusterLaunchTemplate.latestVersion.apply(v => v.toString()),
    },
    tags: {
        Name: "tractionEKSClusterNG"
    },
});

export const eksClusterName = tractionEKSCluster.eksCluster.name;
export const nodeGroupName = tractionEKSClusterNG.nodeGroupName;
export const kubeconfig = tractionEKSCluster.kubeconfig;
