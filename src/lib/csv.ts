import type { RawDataRow } from './types';

// Based on README.md
const CSV_HEADERS = [
  'snapshot_date',
  'policy_start_year',
  'business_type_category',
  'chengdu_branch',
  'third_level_organization',
  'customer_category_3',
  'insurance_type',
  'is_new_energy_vehicle',
  'coverage_type',
  'is_transferred_vehicle',
  'renewal_status',
  'vehicle_insurance_grade',
  'highway_risk_grade',
  'large_truck_score',
  'small_truck_score',
  'terminal_source',
  'signed_premium_yuan',
  'matured_premium_yuan',
  'policy_count',
  'claim_case_count',
  'reported_claim_payment_yuan',
  'expense_amount_yuan',
  'commercial_premium_before_discount_yuan',
  'premium_plan_yuan',
  'marginal_contribution_amount_yuan',
  'week_number'
];

const NUMERIC_FIELDS = [
  'policy_start_year',
  'large_truck_score',
  'small_truck_score',
  'signed_premium_yuan',
  'matured_premium_yuan',
  'policy_count',
  'claim_case_count',
  'reported_claim_payment_yuan',
  'expense_amount_yuan',
  'commercial_premium_before_discount_yuan',
  'premium_plan_yuan',
  'marginal_contribution_amount_yuan',
  'week_number'
];


export function parseCSV(file: File): Promise<RawDataRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        return reject(new Error("CSV 文件为空或只有标题行。"));
      }
      
      const header = lines[0].split(',').map(h => h.trim());
      // Basic header validation
      if (JSON.stringify(header) !== JSON.stringify(CSV_HEADERS)) {
         console.warn("CSV header mismatch:", header, CSV_HEADERS);
         return reject(new Error("CSV 文件头与预期格式不匹配。请下载模板以确保格式正确。"));
      }

      const data: RawDataRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const rowObject: any = {};
        for (let j = 0; j < header.length; j++) {
            const key = header[j];
            let value: string | number | null = values[j];

            if (NUMERIC_FIELDS.includes(key)) {
                value = value === '' ? null : parseFloat(value);
                 if (value !== null && isNaN(value)) {
                    // Skip row if a numeric field is invalid, and log an error
                    console.warn(`Invalid numeric value at row ${i+1}, column ${key}. Skipping row.`);
                    continue; // to next line
                }
            }
            rowObject[key] = value;
        }
         // Ensure all required fields are present after parsing the row
        if (header.length === Object.keys(rowObject).length) {
            data.push(rowObject as RawDataRow);
        }
      }
      resolve(data);
    };

    reader.onerror = (e) => {
      reject(new Error("读取文件时出错。"));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

export function exportToCSV(data: RawDataRow[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]) as (keyof RawDataRow)[];
    const csvRows = [
        headers.join(','), 
        ...data.map(row => 
            headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(',')
        )
    ];

    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
