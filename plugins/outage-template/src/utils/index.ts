export const getStatusColor = (status: string) => {
  switch (status) {
    case 'resolved':
      return '#3cd125';
    case 'investigating':
      return '#f6bf29';
    case 'monitoring':
      return '#ffe072';
    case 'identified':
      return '#fdb659';
    case 'in_progress':
      return '#ffe072';
    case 'completed':
      return '#3d7317';
    case 'scheduled':
      return '#63bdbd';
    case 'verifying':
      return '#63bdbd';
    case 'postmortem':
      return '#63bdbd';
    case 'critical':
      return '#a60000';
    case 'major':
      return '#f5921b';
    case 'minor':
      return '#0066cc';
    case 'none':
      return '#9e9e9e';
    default:
      return 'default';
  }
};

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Backstage-style chip function with theme-aware styling
export const getBackstageChipStyle = (
  status: string,
  variant: 'outlined' | 'default' = 'outlined',
) => {
  const baseColor = getStatusColor(status);

  if (variant === 'default') {
    // Filled style with enhanced theme support
    return {
      backgroundColor: hexToRgba(baseColor, 0.15), // Slightly more visible background
      color: baseColor,
      fontWeight: 500, // Medium weight like Backstage
      border: `1px solid ${hexToRgba(baseColor, 0.25)}`, // Subtle border for definition
      fontSize: '0.8125rem', // Standard Backstage chip font size
      height: '24px', // Standard height
      borderRadius: '12px', // Rounded like Backstage chips
      transition: 'all 0.2s ease-in-out', // Smooth transitions
      '&:hover': {
        backgroundColor: hexToRgba(baseColor, 0.22),
        borderColor: hexToRgba(baseColor, 0.35),
      },
    };
  }
  // Outlined style with better contrast
  return {
    backgroundColor: 'transparent',
    color: baseColor,
    borderColor: hexToRgba(baseColor, 0.7), // Higher opacity for better visibility
    fontWeight: 500,
    fontSize: '0.8125rem',
    height: '24px',
    borderRadius: '12px',
    transition: 'all 0.2s ease-in-out', // Smooth transitions
    '&:hover': {
      backgroundColor: hexToRgba(baseColor, 0.08),
      borderColor: baseColor, // Full color on hover
    },
  };
};

// Legacy function for compatibility - use getBackstageChipStyle instead
export const getStatusChipStyle = getBackstageChipStyle;
