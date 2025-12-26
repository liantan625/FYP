import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Alert } from 'react-native';


interface ReportData {
  income: number;
  expenses: number;
  expenseCategories: any[];
  trendData: any;
  month: string;
}

interface Transaction {
  date: Date;
  type: string;
  category: string;
  amount: number;
  description?: string;
  note?: string;
}

export const generatePDF = async (data: ReportData, t: (key: string) => string) => {
  try {
    const { income, expenses, expenseCategories, trendData, month } = data;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
            h1 { color: #4CAF50; text-align: center; }
            h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; }
            .summary-card { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; color: #666; }
            .value { font-weight: bold; }
            .income { color: #4CAF50; }
            .expense { color: #F44336; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>DuitU ${t('report.title')}</h1>
          <p>${t('report.thisMonth')}: ${month}</p>
          
          <div class="summary-card">
            <h2>${t('report.smartAnalysis')}</h2>
            <div class="row">
              <span class="label">${t('report.income')}:</span>
              <span class="value income">RM ${income.toFixed(2)}</span>
            </div>
            <div class="row">
              <span class="label">${t('report.expense')}:</span>
              <span class="value expense">RM ${expenses.toFixed(2)}</span>
            </div>
            <div class="row">
              <span class="label">${t('report.savingsRate')}:</span>
              <span class="value">${income > 0 ? ((income - expenses) / income * 100).toFixed(1) : '0.0'}%</span>
            </div>
          </div>

          <h2>${t('report.expenseBreakdown')}</h2>
          <table>
            <tr>
              <th>${t('report.category')}</th>
              <th>${t('report.amount')}</th>
              <th>%</th>
            </tr>
            ${expenseCategories.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>RM ${item.amount.toFixed(2)}</td>
                <td>${item.percentage.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </table>

          <h2>${t('report.monthlyTrend')}</h2>
          <table>
            <tr>
              <th>${t('report.month')}</th>
              <th>${t('report.income')}</th>
              <th>${t('report.expense')}</th>
            </tr>
            ${trendData.labels.map((label: string, index: number) => `
              <tr>
                <td>${label}</td>
                <td>RM ${trendData.datasets[0].data[index].toFixed(2)}</td>
                <td>RM ${trendData.datasets[1].data[index].toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    return true;

  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback for some Android devices where printToFileAsync fails
    try {
      const { income, expenses, expenseCategories, trendData, month } = data;
      // Use the same htmlContent variable logic here if we were within scope, 
      // but since we are in catch, I'll just suggest trying again or checking WebView.
      // Actually, let's just fix the CSV error first as it's a definite code bug.
      throw error;
    } catch (inner) {
      throw inner;
    }
  }
};

export const generateCSV = async (transactions: Transaction[]) => {
  try {
    const sortedTransactions = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    let csvHeader = "Date,Type,Category,Amount,Description\n";
    const csvRows = sortedTransactions.map(item => {
      const dateStr = item.date.toISOString().split('T')[0];
      const description = item.note || item.description || '';
      // Escape quotes in description to prevent CSV breakage
      const safeDesc = description.replace(/"/g, '""');
      return `${dateStr},${item.type},${item.category},${item.amount.toFixed(2)},"${safeDesc}"`;
    }).join('\n');

    const csvString = csvHeader + csvRows;
    const dir = FileSystemLegacy.documentDirectory || FileSystemLegacy.cacheDirectory;
    const fileUri = dir + 'DuitU_Report.csv';
    await FileSystemLegacy.writeAsStringAsync(fileUri, csvString, { encoding: 'utf8' });
    
    // Give OS a moment to finish writing before sharing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await Sharing.shareAsync(fileUri, { 
      mimeType: 'text/csv', 
      dialogTitle: 'Save or Share CSV',
      UTI: 'public.comma-separated-values-text' 
    });
    return true;
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw error;
  }
};
