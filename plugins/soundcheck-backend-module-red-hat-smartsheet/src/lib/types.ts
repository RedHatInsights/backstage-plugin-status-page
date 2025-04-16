// Provides typescript support to Smartsheet json response.
export interface SmartsheetData {
  columns: {
    id: number;
    title: string;
  }[];
  rows: {
    cells: {
      columnId: number;
      displayValue: string;
    }[];
  }[];
}
