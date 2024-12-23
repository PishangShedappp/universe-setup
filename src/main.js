import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';

const access = promisify(fs.access);
const copy = promisify(ncp);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function copyTemplateFiles(options) {
    return copy(options.templateDirectory, options.targetDirectory, {
        clobber: false,
    }); 
}

async function updatePackageJson(options) {
    const packageJsonPath = path.join(options.targetDirectory, 'package.json');
    
    try {
        const packageJson = await readFile(packageJsonPath, 'utf-8');
        const packageData = JSON.parse(packageJson);
        
        // Update the name field
        packageData.name = options.projectName;

        // Write the updated package.json back to the target directory
        await writeFile(packageJsonPath, JSON.stringify(packageData, null, 2));
    } catch (err) {
        console.error('%s Failed to update package.json', chalk.red.bold('ERROR'));
        console.error(err);
    }
}

export async function createProject(options) {
    // Set the target directory to the project name
    options.targetDirectory = path.join(process.cwd(), options.projectName);

    let templateName = '';
    if (options.framework == "Next.js") {
        templateName = options.useTailwind == true ? 'nextjs-tailwind' : 'nextjs';
    } else if (options.framework == "Remix") {
        templateName = options.useTailwind == true ? 'remix-tailwind' : 'remix';
    } else if (options.framework == "Vue.js") {
        templateName = options.useTailwind == true ? 'vuejs-tailwind' : 'vuejs';
    } else if (options.framework == "Vite") {
        if (options.viteFramework == "React") {
            templateName = options.useTailwind == true ? 'vite-react-tailwind' : 'vite-react';
        }
    } 

    if (options.uiLibrary == 'ShadcnUI') {
        templateName += '-shadcn';
    } else if (options.uiLibrary == 'NextUI') {
        templateName += '-nextui';
    } else if (options.uiLibrary == 'DaisyUI') {
        templateName += '-daisyui';
    }

    const currentFileUrl = import.meta.url;
    const templateDir = path.resolve(
        fileURLToPath(currentFileUrl), // Converts the file URL to a valid file path
        '../../templates',
        templateName.toLowerCase()
    );
    options.templateDirectory = templateDir

    // Check if the target directory exists, if not create it
    if (!fs.existsSync(options.targetDirectory)) {
        fs.mkdirSync(options.targetDirectory, { recursive: true });
    }

    try {
        await access(templateDir, fs.constants.R_OK);
    } catch (err) {
        console.error('%s Invalid template name', chalk.red.bold('ERROR'));
        process.exit(1);
    }

    const tasks = new Listr([
        {
            title: 'Create Project',
            task: () => copyTemplateFiles(options),
        },
        {
            title: 'Finalize Project',
            task: () => updatePackageJson(options),
        },
        {
            title: "Install Dependencies",
            task: () => projectInstall({
                cwd: options.targetDirectory,
            }),
            skip: () => !options.runInstall
        }
    ])

    console.log(" ")
    await tasks.run();

    console.log(" ")
    console.log(`%s Project '${options.projectName}' Is Ready`, chalk.green.bold('DONE'));
    console.log(" ")
    console.log("To start:")
    console.log(chalk.green.bold(`  cd ${options.projectName}`))
    if (!options.runInstall) {
        console.log(chalk.green.bold(`  npm install`))
    }
    console.log(chalk.green.bold(`  npm run dev`))
    return true;
}