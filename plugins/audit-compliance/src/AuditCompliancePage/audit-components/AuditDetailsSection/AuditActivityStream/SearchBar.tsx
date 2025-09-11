import { Box, Typography, TextField, InputAdornment } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  resultCount: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onClear,
  resultCount,
}) => (
  <Box display="flex" alignItems="center">
    <TextField
      variant="outlined"
      size="small"
      placeholder="Search activities..."
      value={searchTerm}
      onChange={e => onSearchChange(e.target.value)}
      style={{ minWidth: '200px' }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: searchTerm && (
          <InputAdornment position="end">
            <ClearIcon style={{ cursor: 'pointer' }} onClick={onClear} />
          </InputAdornment>
        ),
      }}
    />
    {searchTerm && (
      <Typography
        variant="caption"
        color="textSecondary"
        style={{ marginLeft: '8px' }}
      >
        {resultCount}
      </Typography>
    )}
  </Box>
);
