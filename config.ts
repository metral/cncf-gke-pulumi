import * as pulumi from "@pulumi/pulumi";

let pulumiGcpConfig = new pulumi.Config("gcp");
const gcpProject = pulumiGcpConfig.require("project");
const gcpZone = pulumiGcpConfig.require("zone");

export const config = {
    gcpProject: gcpProject,
    gcpZone: gcpZone,
};
