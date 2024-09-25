import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

/********* Defining the CIDR ranges for VPC and its subnets *********/
const vpcCidr = "10.224.0.0/16";
const publicSubnetCidrA = "10.224.1.0/24";
const publicSubnetCidrB = "10.224.2.0/24";
const privateSubnetCidrA = "10.224.3.0/24";
const privateSubnetCidrB = "10.224.4.0/24";

/********* Creating the VPC resource *********/
export const tractionEksVPC = new aws.ec2.Vpc("traction-eks-vpc", {
    cidrBlock: vpcCidr,
    enableDnsSupport: true,
    enableDnsHostnames: true,
    tags: { 
        Name: "traction-eks-vpc" 
    },
});

/********* CREATING THE SUBNETS FOR VPC *********/
// Creating the publicSubnetA resource
export const tractionEksPublicSubnetA = new aws.ec2.Subnet("tractionEksPublicSubnetA", {
    vpcId: tractionEksVPC.id,
    cidrBlock: publicSubnetCidrA,
    availabilityZone: "us-west-1a",
    tags: {
        Name: "tractionEksPublicSubnetA"
    },
});

// Creating the publicSubnetB resource
export const tractionEksPublicSubnetB = new aws.ec2.Subnet("tractionEksPublicSubnetB", {
    vpcId: tractionEksVPC.id,
    cidrBlock: publicSubnetCidrB,
    availabilityZone: "us-west-1b",
    tags: {
        Name: "tractionEksPublicSubnetB"
    },
});

// Creating the privateSubnetA resource
export const tractionEksPrivateSubnetA = new aws.ec2.Subnet("tractionEksPrivateSubnetA", {
    vpcId: tractionEksVPC.id,
    cidrBlock: privateSubnetCidrA,
    availabilityZone: "us-west-1a",
    tags: {
        Name: "tractionEksPrivateSubnetA"
    },
});


// Creating the privateSubnetB resource
export const tractionEksPrivateSubnetB = new aws.ec2.Subnet("tractionEksPrivateSubnetB", {
    vpcId: tractionEksVPC.id,
    cidrBlock: privateSubnetCidrB,
    availabilityZone: "us-west-1b",
    tags: {
        Name: "tractionEksPrivateSubnetB"
    },
});

// Creating Internet Gateway (IGW) for tractionEksPublicRtb
export const tractionEksIGW = new aws.ec2.InternetGateway("tractionEksIGW", {
    vpcId: tractionEksVPC.id,
    tags: {
        Name: "tractionEksIGW"
    },
})

/********* Creating Elastic IP and NAT Gateway for tractionEksPrivateRtb *********/
// Elastic IP
export const tractionNatGatewayEip = new aws.ec2.Eip("tractionNatGatewayEip", {
    //vpc: true,
    domain: "vpc",
    tags: {
        Name: "tractionNatGatewayEip"
    },
});
// NAT Gateway (NOTE: creation of NAT Gateway is always in public subnet)
export const tractionNatGateway = new aws.ec2.NatGateway("tractionNatGateway", {
    subnetId: tractionEksPublicSubnetA.id,
    allocationId: tractionNatGatewayEip.id,
    tags: {
        Name: "tractionNatGateway"
    },
}, { dependsOn: [tractionNatGatewayEip]
});

/********* CREATING THE ROUTE TABLES *********/
// Creating Public Route table for Public subnets
export const tractionEksPublicRtb = new aws.ec2.RouteTable("tractionEksPublicSubnetRtb", {
    vpcId: tractionEksVPC.id,
    routes: [{
       cidrBlock: "0.0.0.0/0",
       gatewayId: tractionEksIGW.id, 
    }],
    tags: {
        Name: "tractionEksPublicSubnetRtb"
    },
});

// Creating Private Route table for Private subnets
export const tractionEksPrivateRtb = new aws.ec2.RouteTable("tractionEksPrivateSubnetRtb", {
    vpcId: tractionEksVPC.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        natGatewayId: tractionNatGateway.id,
    }],
    tags: {
        Name: "tractionEksPrivateSubnetRtb"
    },
});

/********* Creating Association Resource to associate public/private route tables to subnets *********/
// RouteTable Association for public subnet A
new aws.ec2.RouteTableAssociation("publicRtbAssociationA", {
    routeTableId: tractionEksPublicRtb.id,
    subnetId: tractionEksPublicSubnetA.id,   
});
// RouteTable Association for public subnet B
new aws.ec2.RouteTableAssociation("publicRtbAssociationB", {
    routeTableId: tractionEksPublicRtb.id,
    subnetId: tractionEksPublicSubnetB.id,   
});
// RouteTable Association for private subnet A
new aws.ec2.RouteTableAssociation("privateRtbAssociationA", {
    routeTableId: tractionEksPrivateRtb.id,
    subnetId: tractionEksPrivateSubnetA.id,   
});
// RouteTable Association for private subnet B
new aws.ec2.RouteTableAssociation("privateRtbAssociationB", {
    routeTableId: tractionEksPrivateRtb.id,
    subnetId: tractionEksPrivateSubnetB.id,   
});