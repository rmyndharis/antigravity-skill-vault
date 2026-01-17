#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

const program = new Command();

// Resolve paths
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const SKILLS_SOURCE_DIR = path.join(PACKAGE_ROOT, 'skills');

// Define destinations
const GLOBAL_SKILLS_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'skills');
const LOCAL_SKILLS_DIR = path.join(process.cwd(), '.agent', 'skills');

program
  .name('ag-skills')
  .description('Manage Antigravity Skills')
  .version('1.0.0');

program
  .command('list')
  .description('List all available skills in the vault')
  .action(async () => {
    try {
      const skills = await fs.readdir(SKILLS_SOURCE_DIR);
      console.log(chalk.bold('\nAvailable Skills:\n'));
      skills.forEach(skill => {
        if (skill.startsWith('.')) return;
        console.log(`- ${chalk.cyan(skill)}`);
      });
      console.log(chalk.green(`\nTotal: ${skills.length} skills`));
    } catch (err) {
      console.error(chalk.red('Error listing skills:'), err.message);
    }
  });

program
  .command('install [skillName]')
  .description('Install a skill to your workspace or globally')
  .option('-g, --global', 'Install to global workspace (~/.gemini/antigravity/skills)')
  .option('-a, --all', 'Install ALL skills')
  .action(async (skillName, options) => {
    const targetDir = options.global ? GLOBAL_SKILLS_DIR : LOCAL_SKILLS_DIR;
    
    if (!skillName && !options.all) {
      console.error(chalk.red('Error: Please specify a skill name or use --all'));
      process.exit(1);
    }

    try {
      await fs.ensureDir(targetDir);
      console.log(chalk.gray(`Target directory: ${targetDir}`));

      const skillsToInstall = options.all 
        ? (await fs.readdir(SKILLS_SOURCE_DIR)).filter(f => !f.startsWith('.'))
        : [skillName];

      for (const skill of skillsToInstall) {
        const sourcePath = path.join(SKILLS_SOURCE_DIR, skill);
        const destPath = path.join(targetDir, skill);

        if (!await fs.pathExists(sourcePath)) {
          console.error(chalk.red(`Skill '${skill}' not found in vault.`));
          continue;
        }

        await fs.copy(sourcePath, destPath, { overwrite: true });
        console.log(`${chalk.green('✔ Installed:')} ${skill}`);
      }
      
      console.log(chalk.bold.green('\nInstallation complete!'));
      console.log('Restart your agent session to see changes.');

    } catch (err) {
      console.error(chalk.red('Installation failed:'), err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
