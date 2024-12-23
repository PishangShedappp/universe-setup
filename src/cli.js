import arg from 'arg';
import inquirer from 'inquirer';
import { createProject } from './main.js';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--install': Boolean,
            '-i': '--install',
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        projectName: args._[0],
        runInstall: args['--install'],
    };
}

async function promptForMissingOptions(options) {
    const questions = [];
    if (!options.projectName) {
        questions.push({
            type: 'input',
            name: 'projectName',
            message: 'Please enter the name of your project:',
            default: 'my-project',
        });
    }

    questions.push({
        type: 'list',
        name: 'framework',
        message: 'Which framework do you want to use?',
        choices: ['Next.js', 'Remix', 'Vue.js', 'Vite']
    });

    const answers = await inquirer.prompt(questions);

    if (answers.framework == "Vite") {
        const viteFrameworkQuestion = await inquirer.prompt({
            type: 'list',
            name: 'viteFramework',
            message: 'Which Vite framework do you want to use?',
            choices: ['React']
        })

        answers.viteFramework = viteFrameworkQuestion.viteFramework
    }

    if (answers.framework == "Vue.js") {
        const uiLibraryQuestion = await inquirer.prompt({
            type: 'list',
            name: 'uiLibrary',
            message: 'Which UI library do you want to use?',
            choices: ['NextUI', 'DaisyUI', 'None']
        });

        answers.uiLibrary = uiLibraryQuestion.uiLibrary
    }
    
    if (answers.framework !== "Vue.js") {
        const uiLibraryQuestion = await inquirer.prompt({
            type: 'list',
            name: 'uiLibrary',
            message: 'Which UI library do you want to use?',
            choices: ['ShadcnUI', 'NextUI', 'DaisyUI', 'None']
        });

        answers.uiLibrary = uiLibraryQuestion.uiLibrary
    }

    if (answers.uiLibrary == "None") {
        const tailwindQuestion = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'useTailwind',
                message: 'Do you want to use Tailwind CSS?',
                default: true
            }
        ])

        answers.useTailwind = tailwindQuestion.useTailwind
    }

    if (!options.runInstall) {
        const installQuestion = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'runInstall',
                message: 'Do you want to auto install dependencies?',
                default: false
            }
        ])

        options.runInstall = installQuestion.runInstall
    }

    return {
        ...options,
        projectName: options.projectName || answers.projectName,
        framework: answers.framework,
        uiLibrary: answers.uiLibrary,
        useTailwind: answers.useTailwind,
        runInstall: options.runInstall
    };
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args)
    options = await promptForMissingOptions(options)
    await createProject(options)
}