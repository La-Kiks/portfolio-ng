import { Project } from '../app/services/projects/project';

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: '1',
    slug: 'demo',
    title: 'Demo',
    description: 'Demo project',
    images: ['images/demo/01.webp'],
    video: {
      landscape: 'videos/demo/landscape.mp4',
      landscapeLoop: 'videos/demo/landscape-loop.mp4',
      vertical: 'videos/demo/vertical.mp4',
      posterLandscape: 'videos/demo/landscape.webp',
      posterVertical: 'videos/demo/vertical.webp',
      duration: 'PT20S',
    },
    ...overrides,
  };
}
