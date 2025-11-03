import { GetEntityFacetsRequest } from '@backstage/catalog-client';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { ScaffolderField } from '@backstage/plugin-scaffolder-react/alpha';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { ChangeEvent, useEffect, useState } from 'react';
import useAsync from 'react-use/esm/useAsync';
import useEffectOnce from 'react-use/esm/useEffectOnce';
import { EntityFacetPickerProps } from './schema';

export { EntityFacetPickerSchema as EntityNamespacePickerSchema } from './schema';

/**
 * The underlying component that is rendered in the form for the `EntityFacetPicker`
 * field extension.
 *
 * @public
 */
export const EntityFacetPicker = (props: EntityFacetPickerProps) => {
  const {
    formData,
    onChange,
    schema: {
      title = 'Facet field',
      description = 'Use options from any facet',
    },
    uiSchema,
    rawErrors,
    required,
    errors,
  } = props;
  const catalogApi = useApi(catalogApiRef);
  const [options, setOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState(false);
  // const validator = makeValidator().isValidNamespace;
  const kinds = uiSchema['ui:options']?.kinds;
  const showCounts = uiSchema['ui:options']?.showCounts;
  const isDisabled = uiSchema?.['ui:disabled'] ?? false;
  const isMultiple = uiSchema['ui:options']?.multiple ?? false;
  const facet = uiSchema['ui:options']?.facet ?? '';

  const { loading, value: existingValues } = useAsync(async () => {
    const facetsRequest: GetEntityFacetsRequest = { facets: [facet] };
    if (kinds) {
      facetsRequest.filter = { kind: kinds };
    }

    const { facets } = await catalogApi.getEntityFacets(facetsRequest);

    const entityFacets = Object.fromEntries(
      facets[facet].map(({ value, count }) => [value, count]),
    );

    setOptions(
      Object.keys(entityFacets).sort((a, b) =>
        showCounts ? entityFacets[b] - entityFacets[a] : a.localeCompare(b),
      ),
    );

    return entityFacets;
  });

  const onInput = (_: ChangeEvent<{}>, values: string | string[] | null) => {
    // Reset error state in case all tags were removed
    let hasError = false;
    let addDuplicate = false;
    const currentValues = isMultiple ? formData || [] : formData || '';

    // If adding a new tag
    if (
      typeof values === 'object' &&
      typeof currentValues === 'object' &&
      values?.length &&
      currentValues.length < values.length
    ) {
      const newVal = (values[values.length - 1] = values[values.length - 1]
        .toLocaleLowerCase('en-US')
        .trim());
      hasError = false;
      addDuplicate = currentValues.indexOf(newVal) !== -1;
    }

    setInputError(hasError);
    setInputValue(!hasError ? '' : inputValue);
    if (!hasError && !addDuplicate) {
      if (typeof values === 'object') onChange(values || []);
      else onChange(values || '');
    }
  };

  // Keep inputValue in sync when single mode
  useEffect(() => {
    if (!isMultiple) {
      setInputValue(typeof formData === 'string' ? formData : '');
    }
  }, [formData, isMultiple]);

  // Initialize field to always return an array
  useEffectOnce(() =>
    !!isMultiple ? onChange(formData || []) : onChange(formData || ''),
  );

  return (
    <ScaffolderField
      rawErrors={rawErrors}
      rawDescription={uiSchema['ui:description'] ?? description}
      required={required}
      disabled={isDisabled}
      errors={errors}
    >
      <Autocomplete
        multiple={isMultiple}
        freeSolo
        filterSelectedOptions
        onInputChange={onInput}
        disabled={isDisabled}
        value={isMultiple ? formData || [] : formData || ''}
        inputValue={inputValue}
        loading={loading}
        options={options}
        renderOption={option =>
          showCounts ? `${option} (${existingValues?.[option]})` : option
        }
        renderInput={params => (
          <TextField
            {...params}
            label={title}
            disabled={isDisabled}
            onChange={e => setInputValue(e.target.value)}
            error={inputError}
            required={required}
            FormHelperTextProps={{ margin: 'dense', style: { marginLeft: 0 } }}
          />
        )}
      />
    </ScaffolderField>
  );
};
