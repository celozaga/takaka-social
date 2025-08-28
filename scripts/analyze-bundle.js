#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bundle Analysis Script for Takaka Social
 * 
 * This script analyzes the bundle size, identifies unused dependencies,
 * and provides recommendations for optimization across all platforms.
 */

class BundleAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.packageJsonPath = path.join(this.projectRoot, 'package.json');
    this.nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    this.results = {
      bundleSize: {},
      unusedDependencies: [],
      recommendations: [],
      platformSpecific: {},
    };
  }

  async analyze() {
    console.log('🔍 Starting bundle analysis for Takaka Social...');
    
    try {
      await this.analyzeDependencies();
      await this.analyzeUnusedPackages();
      await this.generateRecommendations();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeDependencies() {
    console.log('📦 Analyzing dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Calculate sizes of major dependencies
    const majorPackages = [
      'react-native',
      'expo',
      '@expo/vector-icons',
      'react-navigation',
      '@shopify/flash-list',
      'react-native-reanimated',
      'react-native-gesture-handler',
    ];

    for (const pkg of majorPackages) {
      if (dependencies[pkg]) {
        try {
          const pkgPath = path.join(this.nodeModulesPath, pkg);
          if (fs.existsSync(pkgPath)) {
            const size = this.calculateDirectorySize(pkgPath);
            this.results.bundleSize[pkg] = {
              version: dependencies[pkg],
              size: this.formatBytes(size),
              sizeBytes: size,
            };
          }
        } catch (error) {
          console.warn(`⚠️  Could not analyze ${pkg}:`, error.message);
        }
      }
    }
  }

  async analyzeUnusedPackages() {
    console.log('🔍 Checking for unused dependencies...');
    
    try {
      // Use depcheck to find unused dependencies
      const depcheckResult = execSync('npx depcheck --json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      });
      
      const depcheck = JSON.parse(depcheckResult);
      this.results.unusedDependencies = depcheck.dependencies || [];
      
      // Check for missing dependencies
      if (depcheck.missing && Object.keys(depcheck.missing).length > 0) {
        this.results.missingDependencies = depcheck.missing;
      }
    } catch (error) {
      console.warn('⚠️  Could not run depcheck:', error.message);
      console.log('💡 Install depcheck: npm install -g depcheck');
    }
  }

  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    const recommendations = [];

    // Check for unused dependencies
    if (this.results.unusedDependencies.length > 0) {
      recommendations.push({
        type: 'unused-deps',
        priority: 'high',
        title: 'Remove unused dependencies',
        description: `Found ${this.results.unusedDependencies.length} unused dependencies`,
        action: `npm uninstall ${this.results.unusedDependencies.join(' ')}`,
        impact: 'Reduces bundle size and improves build times',
      });
    }

    // Check for large packages
    const largePackages = Object.entries(this.results.bundleSize)
      .filter(([, info]) => info.sizeBytes > 5 * 1024 * 1024) // > 5MB
      .map(([name]) => name);

    if (largePackages.length > 0) {
      recommendations.push({
        type: 'large-deps',
        priority: 'medium',
        title: 'Consider alternatives for large dependencies',
        description: `Large packages detected: ${largePackages.join(', ')}`,
        action: 'Review if these packages can be replaced with lighter alternatives',
        impact: 'Significantly reduces bundle size',
      });
    }

    // Platform-specific recommendations
    recommendations.push({
      type: 'platform-optimization',
      priority: 'medium',
      title: 'Enable platform-specific optimizations',
      description: 'Use Platform.select() for platform-specific imports',
      action: 'Review imports and use conditional loading where appropriate',
      impact: 'Reduces platform-specific bundle sizes',
    });

    // Tree shaking recommendations
    recommendations.push({
      type: 'tree-shaking',
      priority: 'high',
      title: 'Optimize imports for tree shaking',
      description: 'Use named imports instead of default imports where possible',
      action: 'Replace import * as X from "package" with import { specific } from "package"',
      impact: 'Eliminates unused code from bundles',
    });

    // Code splitting recommendations
    recommendations.push({
      type: 'code-splitting',
      priority: 'high',
      title: 'Implement route-based code splitting',
      description: 'Split code by routes to reduce initial bundle size',
      action: 'Use React.lazy() and dynamic imports for route components',
      impact: 'Faster initial load times',
    });

    this.results.recommendations = recommendations;
  }

  async generateReport() {
    console.log('📊 Generating analysis report...');
    
    const reportPath = path.join(this.projectRoot, 'bundle-analysis-report.md');
    const report = this.createMarkdownReport();
    
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`✅ Report generated: ${reportPath}`);
    
    // Also log summary to console
    this.logSummary();
  }

  createMarkdownReport() {
    const timestamp = new Date().toISOString();
    
    let report = `# Bundle Analysis Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    
    // Bundle Size Analysis
    report += `## Bundle Size Analysis\n\n`;
    report += `| Package | Version | Size |\n`;
    report += `|---------|---------|------|\n`;
    
    Object.entries(this.results.bundleSize).forEach(([name, info]) => {
      report += `| ${name} | ${info.version} | ${info.size} |\n`;
    });
    
    // Unused Dependencies
    if (this.results.unusedDependencies.length > 0) {
      report += `\n## Unused Dependencies\n\n`;
      report += `The following dependencies appear to be unused and can be removed:\n\n`;
      this.results.unusedDependencies.forEach(dep => {
        report += `- \`${dep}\`\n`;
      });
      report += `\n**Removal command:**\n\`\`\`bash\nnpm uninstall ${this.results.unusedDependencies.join(' ')}\n\`\`\`\n`;
    }
    
    // Recommendations
    report += `\n## Optimization Recommendations\n\n`;
    this.results.recommendations.forEach((rec, index) => {
      report += `### ${index + 1}. ${rec.title} (${rec.priority} priority)\n\n`;
      report += `**Description:** ${rec.description}\n\n`;
      report += `**Action:** ${rec.action}\n\n`;
      report += `**Impact:** ${rec.impact}\n\n`;
    });
    
    // Platform-specific notes
    report += `\n## Platform-Specific Considerations\n\n`;
    report += `### Web\n`;
    report += `- Enable service worker for caching\n`;
    report += `- Use code splitting aggressively\n`;
    report += `- Optimize for Core Web Vitals\n\n`;
    
    report += `### Mobile (iOS/Android)\n`;
    report += `- Be conservative with code splitting\n`;
    report += `- Optimize image loading and caching\n`;
    report += `- Monitor memory usage\n\n`;
    
    // Next steps
    report += `\n## Next Steps\n\n`;
    report += `1. Review and remove unused dependencies\n`;
    report += `2. Implement recommended optimizations\n`;
    report += `3. Test bundle sizes after changes\n`;
    report += `4. Monitor performance metrics\n`;
    report += `5. Run this analysis regularly\n\n`;
    
    report += `---\n\n`;
    report += `*This report was generated automatically by the Takaka Social bundle analyzer.*\n`;
    
    return report;
  }

  logSummary() {
    console.log('\n📊 Bundle Analysis Summary');
    console.log('=' .repeat(50));
    
    // Total bundle size
    const totalSize = Object.values(this.results.bundleSize)
      .reduce((sum, info) => sum + info.sizeBytes, 0);
    console.log(`📦 Total analyzed size: ${this.formatBytes(totalSize)}`);
    
    // Unused dependencies
    if (this.results.unusedDependencies.length > 0) {
      console.log(`🗑️  Unused dependencies: ${this.results.unusedDependencies.length}`);
      console.log(`   ${this.results.unusedDependencies.slice(0, 3).join(', ')}${this.results.unusedDependencies.length > 3 ? '...' : ''}`);
    } else {
      console.log('✅ No unused dependencies found');
    }
    
    // Recommendations
    console.log(`💡 Optimization recommendations: ${this.results.recommendations.length}`);
    const highPriority = this.results.recommendations.filter(r => r.priority === 'high').length;
    if (highPriority > 0) {
      console.log(`   ⚠️  ${highPriority} high priority items`);
    }
    
    console.log('\n📄 Full report saved to: bundle-analysis-report.md');
    console.log('\n🚀 Run optimizations and test the results!');
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += this.calculateDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    
    return totalSize;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = BundleAnalyzer;