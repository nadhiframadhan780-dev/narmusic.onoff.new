declare module 'jsmediatags' {
  export interface TagResult {
    type: string;
    version: string;
    flags: Record<string, unknown>;
    tags: {
      title?: string;
      artist?: string;
      album?: string;
      year?: string;
      genre?: string;
      track?: string;
      lyrics?: {
        lyrics?: string;
        description?: string;
      };
      picture?: {
        format: string;
        data: number[];
        description?: string;
        type?: string;
      };
      [key: string]: unknown;
    };
  }

  export interface ReadOptions {
    onSuccess: (tag: TagResult) => void;
    onError: (error: { type: string; info: string }) => void;
  }

  export function read(file: File | Blob | string, options: ReadOptions): void;
}
