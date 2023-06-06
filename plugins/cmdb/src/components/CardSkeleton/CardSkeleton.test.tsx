import React from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { CardSkeleton } from './CardSkeleton';

describe('<CardSkeleton />', () => {
  it('should render', async () => {
    const skeleton = await renderInTestApp(<CardSkeleton />);
    expect(skeleton).toBeDefined();
  });
  it('should have a parent grid container element', async () => {
    const skeleton = await renderInTestApp(<CardSkeleton />);
    const skeletonContainer = skeleton.asFragment();
    expect(skeletonContainer.childElementCount).toEqual(1);
    expect(skeletonContainer.firstElementChild?.classList.contains('.MuiGrid-root.MuiGrid-container')).toBeTruthy();
  });
  it('should container 6 grid items', async () => {
    const skeleton = await renderInTestApp(<CardSkeleton />);
    const skeletonContainer = skeleton.asFragment();
    expect(skeletonContainer.querySelectorAll('.MuiGrid-root.MuiGrid-item').length).toEqual(6);
  });
});
