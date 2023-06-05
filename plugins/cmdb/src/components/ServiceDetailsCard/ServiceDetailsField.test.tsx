import React from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { ServiceDetailsField } from './ServiceDetailsField';

describe('<ServiceDetailsField>', () => {
  it('should render', async () => {
    const fieldComponent = await renderInTestApp(
      <ServiceDetailsField label="Field Label" />,
    );
    expect(fieldComponent).toBeDefined();
  });
  it('should render a field with a label', async () => {
    const fieldComponent = await renderInTestApp(
      <ServiceDetailsField label="Field Label" />,
    );
    expect(fieldComponent.getByText('Field Label')).toBeDefined();
    expect(fieldComponent.getByText('Field Label').nodeName).toEqual('H2');
  });
  it('should render a field with a label and value', async () => {
    const fieldComponent = await renderInTestApp(
      <ServiceDetailsField label="Field Label" value='Field Value' />,
    );
    expect(fieldComponent.getByText('Field Label')).toBeDefined();
    expect(fieldComponent.getByText('Field Label').nodeName).toEqual('H2');
    expect(fieldComponent.getByText('Field Value')).toBeDefined();
    expect(fieldComponent.getByText('Field Value').nodeName).toEqual('P');
  });
  it('should render a field with a label and child component', async () => {
    const fieldComponent = await renderInTestApp(
      <ServiceDetailsField label="Field Label">
        <div>Child Component</div>
      </ServiceDetailsField>,
    );
    expect(fieldComponent.getByText('Field Label')).toBeDefined();
    expect(fieldComponent.getByText('Field Label').nodeName).toEqual('H2');
    expect(fieldComponent.getByText('Child Component')).toBeDefined();
    expect(fieldComponent.getByText('Child Component').nodeName).toEqual('DIV');
  });
});
