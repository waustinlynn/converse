import * as cdk from 'aws-cdk-lib';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface AppStackProps extends cdk.StackProps {
  table: dynamodb.Table;
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    // 1. Build and push Docker image from the root context
    const imageAsset = new ecr_assets.DockerImageAsset(this, 'BackendImage', {
      directory: path.join(__dirname, '../../'),
      file: 'backend/Dockerfile',
    });

    // 2. Create the App Runner Service
    const service = new apprunner.Service(this, 'ConverseBackendService', {
      source: apprunner.Source.fromAsset({
        asset: imageAsset,
        imageConfiguration: {
          port: 3000,
          environmentVariables: {
            DYNAMODB_TABLE: props.table.tableName,
            GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? 'placeholder-set-in-console',
            NODE_ENV: 'production',
          },
        },
      }),
      cpu: apprunner.Cpu.QUARTER_VCPU,
      memory: apprunner.Memory.HALF_GB,
    });

    // 3. Grant DynamoDB permissions to the App Runner service
    props.table.grantReadWriteData(service);

    // Output the Service URL
    new cdk.CfnOutput(this, 'ServiceUrl', {
      value: service.serviceUrl,
      description: 'The URL of the App Runner service',
    });
  }
}
