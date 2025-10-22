#!/usr/bin/env node

/**
 * NMM-FLOW Architecture Alignment Script
 * Ensures all components follow consistent patterns and best practices
 */

const fs = require('fs');
const path = require('path');

const COMPONENT_DIR = path.join(__dirname, '../src/components');
const SERVICES_DIR = path.join(__dirname, '../src/services');

// Architecture validation rules
const VALIDATION_RULES = {
  components: {
    requiredImports: ['React'],
    namingConvention: /^[A-Z][a-zA-Z]*\.tsx$/,
    exportPattern: /export default \w+/
  },
  services: {
    requiredImports: ['axios'],
    namingConvention: /^[a-z][a-zA-Z]*\.ts$/,
    exportPattern: /export (const|interface|type)/
  }
};

function validateComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const issues = [];

  // Check naming convention
  if (!VALIDATION_RULES.components.namingConvention.test(fileName)) {
    issues.push(`Invalid naming: ${fileName} should follow PascalCase.tsx`);
  }

  // Check required imports
  if (!content.includes('import React')) {
    issues.push(`Missing React import in ${fileName}`);
  }

  // Check export pattern
  if (!VALIDATION_RULES.components.exportPattern.test(content)) {
    issues.push(`Missing default export in ${fileName}`);
  }

  // Check TypeScript interface usage
  if (!content.includes('interface') && !content.includes('type')) {
    console.warn(`Consider adding TypeScript interfaces in ${fileName}`);
  }

  return issues;
}

function validateService(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const issues = [];

  // Check naming convention
  if (!VALIDATION_RULES.services.namingConvention.test(fileName)) {
    issues.push(`Invalid naming: ${fileName} should follow camelCase.ts`);
  }

  // Check required imports for API services
  if (fileName.includes('api') && !content.includes('axios')) {
    issues.push(`Missing axios import in ${fileName}`);
  }

  // Check export pattern
  if (!VALIDATION_RULES.services.exportPattern.test(content)) {
    issues.push(`Missing proper exports in ${fileName}`);
  }

  return issues;
}

function checkArchitecturalAlignment() {
  console.log('🔍 Checking NMM-FLOW Architecture Alignment...\n');

  let totalIssues = 0;

  // Validate components
  console.log('📁 Validating Components:');
  const componentFiles = fs.readdirSync(COMPONENT_DIR).filter(f => f.endsWith('.tsx'));
  
  componentFiles.forEach(file => {
    const filePath = path.join(COMPONENT_DIR, file);
    const issues = validateComponent(filePath);
    
    if (issues.length === 0) {
      console.log(`  ✅ ${file} - OK`);
    } else {
      console.log(`  ❌ ${file} - Issues found:`);
      issues.forEach(issue => console.log(`     - ${issue}`));
      totalIssues += issues.length;
    }
  });

  // Validate services
  console.log('\n📁 Validating Services:');
  const serviceFiles = fs.readdirSync(SERVICES_DIR).filter(f => f.endsWith('.ts'));
  
  serviceFiles.forEach(file => {
    const filePath = path.join(SERVICES_DIR, file);
    const issues = validateService(filePath);
    
    if (issues.length === 0) {
      console.log(`  ✅ ${file} - OK`);
    } else {
      console.log(`  ❌ ${file} - Issues found:`);
      issues.forEach(issue => console.log(`     - ${issue}`));
      totalIssues += issues.length;
    }
  });

  // Check package.json dependencies
  console.log('\n📦 Validating Dependencies:');
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = [
    'react', 'react-dom', 'typescript', 'react-router-dom',
    'axios', 'tailwindcss', 'framer-motion', 'react-dropzone',
    'lucide-react', 'react-hot-toast'
  ];

  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );

  if (missingDeps.length === 0) {
    console.log('  ✅ All required dependencies present');
  } else {
    console.log('  ❌ Missing dependencies:', missingDeps.join(', '));
    totalIssues += missingDeps.length;
  }

  // Check Tailwind configuration
  console.log('\n🎨 Validating Tailwind Configuration:');
  const tailwindPath = path.join(__dirname, '../tailwind.config.js');
  const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');
  
  if (tailwindContent.includes('Open Sans') && tailwindContent.includes('#007bff')) {
    console.log('  ✅ HCLTech branding configuration present');
  } else {
    console.log('  ❌ Missing HCLTech branding configuration');
    totalIssues++;
  }

  // Summary
  console.log('\n📊 Architecture Alignment Summary:');
  console.log(`  Components: ${componentFiles.length} files`);
  console.log(`  Services: ${serviceFiles.length} files`);
  console.log(`  Total Issues: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 Architecture is fully aligned! All checks passed.');
  } else {
    console.log(`\n⚠️  Found ${totalIssues} alignment issues that need attention.`);
  }

  return totalIssues === 0;
}

// Run the alignment check
if (require.main === module) {
  const isAligned = checkArchitecturalAlignment();
  process.exit(isAligned ? 0 : 1);
}

module.exports = { checkArchitecturalAlignment };
