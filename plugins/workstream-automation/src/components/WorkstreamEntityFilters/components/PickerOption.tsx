import { EntityDisplayName } from '@backstage/plugin-catalog-react';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import React, { memo } from 'react';

interface OptionProps {
  selected: boolean;
  value: string;
  availableOptions?: Record<string, number>;
  showCounts: boolean;
  isEnitityRef?: boolean;
}

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

function OptionCheckbox({ selected }: { readonly selected: boolean }) {
  return <Checkbox icon={icon} checkedIcon={checkedIcon} checked={selected} />;
}

export const PickerOption = memo((props: OptionProps) => {
  const {
    selected,
    value,
    availableOptions,
    showCounts,
    isEnitityRef = false,
  } = props;

  const label = showCounts ? (
    <>
      {isEnitityRef ? <EntityDisplayName entityRef={value} /> : value}
      {` (${availableOptions?.[value]})`}
    </>
  ) : (
    <>{isEnitityRef ? <EntityDisplayName entityRef={value} /> : value}</>
  );

  return (
    <FormControlLabel
      control={<OptionCheckbox selected={selected} />}
      label={label}
      onClick={event => event.preventDefault()}
    />
  );
});
