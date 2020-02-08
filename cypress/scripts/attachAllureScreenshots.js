const path = require('path');
const fs = require('fs-extra');
const klawSync = require('klaw-sync');

const sanitized = string => {
  return string.replace(/[\"\/]+/g, '');
};

const klawSyncDir = folder => {
  if (fs.existsSync(folder)) {
    return klawSync(folder, {
      traverseAll: true
    });
  }
};

const cypressScreenshots = klawSyncDir('cypress/screenshots') || [];
const allureResultsPath = 'allure-results';

fs.readdirSync(allureResultsPath).forEach(file => {
  const filename = path.join(allureResultsPath, file);
  const stat = fs.lstatSync(filename);
  if (!stat.isDirectory() && filename.endsWith('result.json')) {
    const report = fs.readJsonSync(filename, 'utf-8');
    // Attach screenshots
    cypressScreenshots
      .filter(s => s.path.includes(sanitized(report.name)))
      .forEach(screenshot => {
        report.attachments.push({
          name: 'Screenshot',
          source: path.join(
            '..',
            'cypress',
            screenshot.path.split('cypress')[1]
          ),
          type: 'image/png'
        });
      });
    // Write updates to allure-results file
    fs.writeFileSync(filename, JSON.stringify(report), err => {
      if (err) {
        throw err;
      }
    });
  }
});
