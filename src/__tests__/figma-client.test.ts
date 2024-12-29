import { FigmaClient } from '../figma-client';
import axios from 'axios';
import { FigmaVariable } from '../types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FigmaClient', () => {
  let client: FigmaClient;

  interface MockAxiosInstance {
    get: jest.Mock;
  }

  const mockAxiosInstance: MockAxiosInstance = {
    get: jest.fn(),
  };

  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as typeof axios);
    client = new FigmaClient('test-token', 'test-file-id');
    jest.clearAllMocks();
  });

  describe('getLocalVariables', () => {
    it('should fetch Figma variables successfully', async () => {
      const mockVariables: FigmaVariable[] = [
        {
          id: '1',
          name: 'Primary',
          value: '#FF0000',
          scopes: ['ALL_FILLS'],
          hiddenFromPublishing: false,
          valuesByMode: {
            mode1: '#FF0000',
          },
        },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          meta: {
            variableCollections: {
              '123': {
                id: '123',
                name: 'Colors',
                defaultModeId: 'mode1',
                modes: [{ modeId: 'mode1', name: 'Default' }],
                variables: mockVariables,
              },
            },
          },
        },
      });

      const variables = await client.getLocalVariables();
      expect(variables).toHaveLength(mockVariables.length);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/files/test-file-id/variables/local');
    });

    it('should handle 403 error correctly', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 403 },
      });

      await expect(client.getLocalVariables()).rejects.toThrow(
        'Invalid Figma access token or insufficient permissions',
      );
    });

    it('should handle other errors correctly', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(client.getLocalVariables()).rejects.toThrow(error);
    });

    it('should handle multiple variable collections', async () => {
      const mockResponse = {
        data: {
          meta: {
            variableCollections: {
              collection1: {
                id: 'collection1',
                name: 'Colors',
                defaultModeId: 'mode1',
                modes: [{ modeId: 'mode1', name: 'Default' }],
                variables: [
                  {
                    id: '1',
                    name: 'Primary',
                    scopes: ['ALL_FILLS'],
                    hiddenFromPublishing: false,
                    valuesByMode: { mode1: '#FF0000' },
                  },
                ],
              },
              collection2: {
                id: 'collection2',
                name: 'Typography',
                defaultModeId: 'mode1',
                modes: [{ modeId: 'mode1', name: 'Default' }],
                variables: [
                  {
                    id: '2',
                    name: 'Body',
                    scopes: ['FONT_SIZE'],
                    hiddenFromPublishing: false,
                    valuesByMode: { mode1: '16' },
                  },
                ],
              },
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const variables = await client.getLocalVariables();
      expect(variables).toHaveLength(2);
    });
  });

  describe('getFileInfo', () => {
    it('should fetch file info successfully', async () => {
      const mockResponse = {
        data: {
          name: 'Design System',
          lastModified: '2024-03-14T12:00:00Z',
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const fileInfo = await client.getFileInfo();
      expect(fileInfo).toEqual({
        name: 'Design System',
        lastModified: '2024-03-14T12:00:00Z',
      });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/files/test-file-id');
    });

    it('should handle file info fetch error', async () => {
      const error = new Error('Failed to fetch file info');
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(client.getFileInfo()).rejects.toThrow(error);
    });
  });
});
