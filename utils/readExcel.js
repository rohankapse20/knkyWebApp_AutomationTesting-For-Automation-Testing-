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

const xlsx = require('xlsx');

function readChatDataFromExcel(filePath, sheetName = 'chatTest_Data') {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(ws);
  return json; // Array of test data
}

module.exports = { readChatDataFromExcel };


module.exports = { getTestData };
