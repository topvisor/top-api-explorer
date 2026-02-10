import YAML from 'js-yaml';
import specText from './data/spec.yaml?raw';
import type { ParsedEndpoint, HttpMethod } from './types';

const METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];

export function parseSpecText(input: string): any {
  return YAML.load(input);
}

export function loadEmbeddedSpec(): any {
  return parseSpecText(specText);
}

export async function loadSpecFromUrl(specUrl: string): Promise<any> {
  const response = await fetch(specUrl);
  if (!response.ok) {
    throw new Error(`Не удалось загрузить спецификацию: ${response.status} ${response.statusText}`);
  }

  const yamlText = await response.text();
  return parseSpecText(yamlText);
}

export function parseEndpoints(spec: any): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  for (const [path, pathItem] of Object.entries<any>(spec.paths ?? {})) {
    for (const method of METHODS) {
      const operation = pathItem?.[method];
      if (!operation) {
        continue;
      }
      endpoints.push({
        method,
        path,
        operation,
        tag: operation.tags?.[0] ?? 'Default',
      });
    }
  }

  return endpoints;
}

export function groupByTag(endpoints: ParsedEndpoint[]): Record<string, ParsedEndpoint[]> {
  return endpoints.reduce<Record<string, ParsedEndpoint[]>>((acc, endpoint) => {
    if (!acc[endpoint.tag]) {
      acc[endpoint.tag] = [];
    }
    acc[endpoint.tag].push(endpoint);
    return acc;
  }, {});
}
