import { ImportService } from './src/services/importService';
import * as fs from 'fs';

async function main() {
  const filePath = "C:\\Users\\Amear\\OneDrive\\Desktop\\orientation-day\\backend\\students_data\\BE_First_Year_All_Students_Serial_Wise.xlsx";
  const buffer = fs.readFileSync(filePath);
  const parsedRows = ImportService.parseFileBuffer(buffer, 'BE_First_Year_All_Students_Serial_Wise.xlsx');
  
  const preview = ImportService.generatePreview(parsedRows);
  console.log(`Total Rows: ${preview.totalRows}, Valid Rows: ${preview.validRows}, Invalid Rows: ${preview.invalidRows}`);
  
  if (preview.validRows > 0) {
    const confirm = await ImportService.confirmImport(preview.previewRows, 'BE_First_Year_All_Students_Serial_Wise.xlsx');
    console.log(`Import successful: ${confirm.newCandidates} new, ${confirm.updatedCandidates} updated, ${confirm.unchangedCandidates} unchanged, ${confirm.rejectedRows} rejected.`);
  }
}

main().catch(console.error);
