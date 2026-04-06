import * as path from 'path';
import { inspectInventory } from '../src/inspectors/inventory-inspector';
import { inspectDependencies, inspectConfiguration } from '../src/inspectors/manifest-inspector';

const simpleNode = path.join(__dirname, 'fixtures', 'simple-node');

describe('inspectDependencies', () => {
  it('extracts dependencies from package.json', () => {
    const inventory = inspectInventory(simpleNode);
    const deps = inspectDependencies(simpleNode, inventory);
    const names = deps.map(d => d.name);
    expect(names).toContain('express');
    expect(names).toContain('axios');
  });

  it('marks express as critical', () => {
    const inventory = inspectInventory(simpleNode);
    const deps = inspectDependencies(simpleNode, inventory);
    const express = deps.find(d => d.name === 'express');
    expect(express?.critical).toBe(true);
  });

  it('assigns server framework purpose to express', () => {
    const inventory = inspectInventory(simpleNode);
    const deps = inspectDependencies(simpleNode, inventory);
    const express = deps.find(d => d.name === 'express');
    expect(express?.purpose).toBe('Server framework');
  });

  it('assigns http client purpose to axios', () => {
    const inventory = inspectInventory(simpleNode);
    const deps = inspectDependencies(simpleNode, inventory);
    const axios = deps.find(d => d.name === 'axios');
    expect(axios?.purpose).toBe('HTTP client');
  });

  it('returns empty array for directory with no manifest', () => {
    const inventory = inspectInventory(simpleNode);
    const deps = inspectDependencies('/tmp', inventory);
    expect(deps).toEqual([]);
  });
});

describe('inspectConfiguration', () => {
  it('returns an array', () => {
    const inventory = inspectInventory(simpleNode);
    const config = inspectConfiguration(simpleNode, inventory);
    expect(Array.isArray(config)).toBe(true);
  });
});
