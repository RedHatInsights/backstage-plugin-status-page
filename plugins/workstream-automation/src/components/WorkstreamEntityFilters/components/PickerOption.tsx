import { parseEntityRef } from '@backstage/catalog-model';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import { memo } from 'react';

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
      {isEnitityRef ? parseEntityRef(value).name : value}
      {` (${availableOptions?.[value]})`}
    </>
  ) : (
    <>{isEnitityRef ? parseEntityRef(value).name : value}</>
  );

  return (
    <FormControlLabel
      control={<OptionCheckbox selected={selected} />}
      label={label}
      onClick={event => event.preventDefault()}
    />
  );
});
