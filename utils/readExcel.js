const xlsx = require('xlsx');

function getTestData(filePath, sheetName)
{
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];
  
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found in ${filePath}`);

  // Apply desired parsing options here
  return xlsx.utils.sheet_to_json(sheet,
  {
    defval: '',    // Return empty string for empty cells
    raw: false,    // Convert dates and other formats properly
    header: 0      // Use first row as keys
  });
}

module.exports = { getTestData };
