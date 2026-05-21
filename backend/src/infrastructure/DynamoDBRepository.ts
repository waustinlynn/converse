import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { IUserRepository } from "../application/interfaces";
import logger from "./logger";

export class DynamoDBRepository implements IUserRepository {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        const isLocal = !!process.env.DYNAMODB_ENDPOINT;
        const client = new DynamoDBClient({
            region: process.env.AWS_REGION || "us-east-1",
            endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
            credentials: isLocal ? { accessKeyId: "local", secretAccessKey: "local" } : undefined,
        });
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.DYNAMODB_TABLE || "ConverseApp";
    }

    async getUserMetadata(userId: string): Promise<any> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: "METADATA",
            },
        });
        const response = await this.docClient.send(command);
        return response.Item;
    }

    async updateUserMetadata(userId: string, metadata: any): Promise<void> {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: {
                PK: `USER#${userId}`,
                SK: "METADATA",
                ...metadata,
                updatedAt: new Date().toISOString(),
            },
        });
        await this.docClient.send(command);
    }

    async getLanguageProgress(userId: string, langId: string): Promise<any> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `LANG#${langId.toUpperCase()}`,
            },
        });
        const response = await this.docClient.send(command);
        return response.Item;
    }

    async updateLanguageProgress(userId: string, langId: string, progress: any): Promise<void> {
        const command = new PutCommand({
            TableName: this.tableName,
            Item: {
                PK: `USER#${userId}`,
                SK: `LANG#${langId.toUpperCase()}`,
                ...progress,
                updatedAt: new Date().toISOString(),
            },
        });
        await this.docClient.send(command);
    }

    async saveMissionResult(userId: string, missionId: string, result: any): Promise<void> {
        const timestamp = new Date().toISOString();
        const command = new PutCommand({
            TableName: this.tableName,
            Item: {
                PK: `USER#${userId}`,
                SK: `MISSION#${timestamp}`,
                missionId,
                ...result,
                createdAt: timestamp,
            },
        });
        await this.docClient.send(command);
    }

    async getMissionResults(userId: string, limit: number = 10): Promise<any[]> {
        const command = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":sk": "MISSION#",
            },
            ScanIndexForward: false, // Latest first
            Limit: limit,
        });
        const response = await this.docClient.send(command);
        return response.Items || [];
    }

    async updateResumptionHandle(userId: string, handle: string): Promise<void> {
        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: "METADATA",
            },
            UpdateExpression: "SET resumptionHandle = :h, handleUpdatedAt = :t",
            ExpressionAttributeValues: {
                ":h": handle,
                ":t": new Date().toISOString(),
            },
        });
        await this.docClient.send(command);
    }

    async getResumptionHandle(userId: string): Promise<string | null> {
        const metadata = await this.getUserMetadata(userId);
        return metadata?.resumptionHandle || null;
    }

    // Helper to initialize table (for local dev)
    async createTableIfNotExists(): Promise<void> {
        if (!process.env.DYNAMODB_ENDPOINT) return; // Only for local

        try {
            const list = await this.docClient.send(new ListTablesCommand({}));
            if (list.TableNames?.includes(this.tableName)) {
                logger.info(`DynamoDB Table ${this.tableName} already exists.`);
                return;
            }

            const command = new CreateTableCommand({
                TableName: this.tableName,
                KeySchema: [
                    { AttributeName: "PK", KeyType: "HASH" },
                    { AttributeName: "SK", KeyType: "RANGE" },
                ],
                AttributeDefinitions: [
                    { AttributeName: "PK", AttributeType: "S" },
                    { AttributeName: "SK", AttributeType: "S" },
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            });
            await this.docClient.send(command);
            logger.info(`Created DynamoDB Table: ${this.tableName}`);
        } catch (err) {
            logger.error("Failed to initialize local DynamoDB table", err);
        }
    }
}
