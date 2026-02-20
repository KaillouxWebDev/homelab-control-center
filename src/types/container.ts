export interface ContainerPort {
  PublicPort?: number;
  PrivatePort: number;
  Type: string;
}

export interface ContainerItem {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Ports?: ContainerPort[];
}

export interface ContainerInspectResponse {
  Id: string;
  Name: string;
  State: {
    Status: string;
    Running: boolean;
    Health?: { Status?: string };
  };
  Config?: { Image?: string };
  NetworkSettings?: {
    Ports?: Record<string, Array<{ HostPort?: string }>>;
  };
}
