import type { RawDataRow } from './types';
import { normalizeVehicleAttributes } from './utils';

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

/**
 * A robust float parser that removes currency symbols and thousand separators.
 * @param value The string value to parse.
 * @returns A floating point number or null if parsing is not possible.
 */
function parseRobustFloat(value: string): number | null {
    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }
    // Remove common currency symbols and thousand separators, but keep the decimal point.
    const cleanedValue = value.replace(/[^0-9.-]+/g, "");
    if (cleanedValue === '') {
        return null;
    }
    const num = parseFloat(cleanedValue);
    return isNaN(num) ? null : num;
}


export function parseCSV(file: File): Promise<RawDataRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        return reject(new Error("CSV 文件为空或只有标题行。"));
      }
      
      const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      // Basic header validation - 更灵活的头部验证
      const headerMismatch = header.length !== CSV_HEADERS.length || 
        !header.every((h, i) => h.toLowerCase() === CSV_HEADERS[i].toLowerCase());
      
      if (headerMismatch) {
         console.warn("CSV header mismatch:");
         console.warn("实际文件头:", header);
         console.warn("预期文件头:", CSV_HEADERS);
         console.warn("文件头长度:", header.length, "vs", CSV_HEADERS.length);
         
         // 提供更详细的错误信息
         const missingHeaders = CSV_HEADERS.filter(expected => 
           !header.some(actual => actual.toLowerCase() === expected.toLowerCase())
         );
         const extraHeaders = header.filter(actual => 
           !CSV_HEADERS.some(expected => expected.toLowerCase() === actual.toLowerCase())
         );
         
         let errorMessage = "CSV 文件头与预期格式不匹配。请下载模板以确保格式正确。\n\n";
         if (missingHeaders.length > 0) {
           errorMessage += `缺少字段: ${missingHeaders.join(', ')}\n`;
         }
         if (extraHeaders.length > 0) {
           errorMessage += `多余字段: ${extraHeaders.join(', ')}\n`;
         }
         errorMessage += `\n预期字段数量: ${CSV_HEADERS.length}，实际字段数量: ${header.length}`;
         
         return reject(new Error(errorMessage));
      }

      const data: RawDataRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const rowObject: Record<string, string | number | null> = {};
        let skipRow = false;
        for (let j = 0; j < header.length; j++) {
            const key = header[j];
            let value: string | number | null = values[j];

            if (NUMERIC_FIELDS.includes(key)) {
                value = parseRobustFloat(value as string);
                if (value === null && key !== 'large_truck_score' && key !== 'small_truck_score') {
                    // Log a warning for unexpected nulls in critical numeric fields.
                    console.warn(`Invalid or empty numeric value at row ${i+1}, column ${key}. Skipping row.`);
                    skipRow = true;
                    break;
                }
            }
            rowObject[key] = value;
        }

        if (skipRow) continue;

         // Ensure all required fields are present after parsing the row
        if (header.length === Object.keys(rowObject).length) {
            data.push(normalizeVehicleAttributes(rowObject as RawDataRow));
        }
      }
      resolve(data);
    };

    reader.onerror = () => {
      reject(new Error("读取文件时出错。"));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

export function exportToCSV(data: RawDataRow[], filename: string) {
  const headers = CSV_HEADERS.join(',');
  const rows = data.map(row => 
    CSV_HEADERS.map(header => {
      const value = row[header as keyof RawDataRow];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

/**
 * 导出CSV模板文件，包含所有必需的列头
 * @param filename 模板文件名
 */
export function exportCSVTemplate(filename: string = 'csv_template.csv') {
  const headers = CSV_HEADERS.join(',');
  // 添加一行示例数据作为参考
  const sampleRow = [
    '2024-01-01', // snapshot_date
    '2024', // policy_start_year
    '车险', // business_type_category
    '成都分公司', // chengdu_branch
    '营业部A', // third_level_organization
    '个人客户', // customer_category_3
    '交强险', // insurance_type
    '燃油', // is_new_energy_vehicle
    '基本险', // coverage_type
    '非过户', // is_transferred_vehicle
    '续保', // renewal_status
    'A', // vehicle_insurance_grade
    '低风险', // highway_risk_grade
    '0', // large_truck_score
    '0', // small_truck_score
    '线上', // terminal_source
    '5000', // signed_premium_yuan
    '5000', // matured_premium_yuan
    '1', // policy_count
    '0', // claim_case_count
    '0', // reported_claim_payment_yuan
    '500', // expense_amount_yuan
    '5500', // commercial_premium_before_discount_yuan
    '5000', // premium_plan_yuan
    '4500', // marginal_contribution_amount_yuan
    '1' // week_number
  ].join(',');
  
  const csvContent = [headers, sampleRow].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
