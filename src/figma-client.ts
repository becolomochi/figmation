import axios, { AxiosInstance } from 'axios';
import { FigmaVariable, FigmaAPIResponse } from './types';

export class FigmaClient {
  private client: AxiosInstance;
  private fileId: string;

  constructor(accessToken: string, fileId: string) {
    this.fileId = fileId;
    this.client = axios.create({
      baseURL: 'https://api.figma.com/v1',
      headers: {
        'X-Figma-Token': accessToken,
      },
    });
  }

  public async getLocalVariables(): Promise<FigmaVariable[]> {
    try {
      console.log(`🔍 Fetching variables from Figma file: ${this.fileId}`);

      const response = await this.client.get<FigmaAPIResponse>(
        `/files/${this.fileId}/variables/local`,
      );

      const variables: FigmaVariable[] = [];
      const collections = response.data.meta.variableCollections;

      Object.values(collections).forEach((collection) => {
        const defaultModeId = collection.defaultModeId;
        collection.variables.forEach((variable) => {
          variables.push({
            ...variable,
            value: variable.valuesByMode[defaultModeId],
          });
        });
      });

      console.log(`✅ Successfully fetched ${variables.length} variables`);
      return variables;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Invalid Figma access token or insufficient permissions');
      }
      throw error;
    }
  }

  public async getFileInfo() {
    const response = await this.client.get(`/files/${this.fileId}`);
    return {
      name: response.data.name,
      lastModified: response.data.lastModified,
    };
  }
}
