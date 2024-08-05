#!/usr/bin/env node

const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const { execSync } = require('child_process');

async function createProject() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'Project name:',
        },
        {
            type: 'confirm',
            name: 'useTypescript',
            message: 'Do you want to use TypeScript?',
            default: true
        },
        {
            type: 'confirm',
            name: 'useTailwind',
            message: 'Do you want to use Tailwind?',
            default: true
        },
        {
            type: 'confirm',
            name: 'usePretier',
            message: 'Do you want to use Pretier?',
            default: true
        },
        {
            type: 'confirm',
            name: 'useEslint',
            message: 'Do you want to add linting with ESLint?',
            default: true
        },
        {
            type: 'confirm',
            name: 'useVitest',
            message: 'Do you want to add test with Vitest?',
            default: true
        },
        {
            type: 'confirm',
            name: 'useShadcn',
            message: 'Do you want to use Shadcn?',
            default: true
        },
        {
            type: 'confirm',
            name: 'usePrismaAuthJS',
            message: 'Do you want to use Prisma and AuthJS?',
            default: true
        },
        {
            type: 'confirm',
            name: 'useStripe',
            message: 'Do you want to use Stripe?',
            default: true
        },
    ]);

    var { projectName, useTypescript, useTailwind, addPretier, useEslint, useVitest, useShadcn, usePrismaAuthJS, useStripe } = answers;
    if (!projectName) {
        projectName = 'ltpl-app';
    }
    const projectPath = path.join(process.cwd(), projectName);

    let typescriptTypes = 'typescript';
    if (useTypescript === true) {
        typescriptTypes = 'typescript'
    } else {
        typescriptTypes = 'null'
    }

    const { create } = await import('create-svelte');

    try {
        console.log('Creating project directory...');
        console.log('\n');

        // Init svelte kit project

        await create(projectName, {
            name: projectName,
            template: 'skeleton',
            types: typescriptTypes,
            prettier: addPretier,
            eslint: useEslint,
            playwright: true,
            vitest: useVitest,
        });

        // Create .env file

        console.log('Create .env file...');
        const envPath = path.join(projectPath, '.env');
        fs.writeFileSync(envPath, '');
        console.log('\n');


        // Init Tailwind CSS

        if (useTailwind === true) {
            console.log('Installing Tailwind CSS...');
            execSync('pnpm install -D tailwindcss@latest postcss@latest autoprefixer@latest', { cwd: projectPath, stdio: 'inherit' });
            execSync('npx tailwindcss init -p', { cwd: projectPath, stdio: 'inherit' });
            const svelteConfigPath = path.join(projectPath, 'svelte.config.js');
            const tempFileContent = `import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  kit: {
    alias: {
      $lib: "./src/lib"
     },
    adapter: adapter()
  },
  preprocess: vitePreprocess()
};
export default config;`;
            fs.writeFileSync(svelteConfigPath, tempFileContent);
            const tailwindConfigPath = path.join(projectPath, 'tailwind.config.js');
            const tempFileTailwindContent = `/** @type {import('tailwindcss').Config} */
                export default {
                content: ['./src/**/*.{html,js,svelte,ts}'],
                theme: {
                    extend: {}
                },
                plugins: []
                };`;
            fs.writeFileSync(tailwindConfigPath, tempFileTailwindContent);
            const appCss = path.join(projectPath, 'src', 'app.css');
            const appCssContent = `@tailwind base;\n@tailwind components;\n@tailwind utilities;`;
            fs.writeFileSync(appCss, appCssContent);
            const layoutSvelte = path.join(projectPath, 'src', 'routes', '+layout.svelte');
            const layoutContent = "<script>\n\timport '../app.css';\n</script>\n\n<slot />";
            fs.writeFileSync(layoutSvelte, layoutContent);
            console.log('\n');
        } 

        // Init Shadcn

        if (useShadcn === true) {
            console.log('Installing Shadcn...');
            execSync('npx shadcn-svelte@latest init', { cwd: projectPath, stdio: 'inherit' });
            console.log('\n');
        }

        // Init Prisma and AuthJS

        if (usePrismaAuthJS === true) {
            console.log('Installing Prisma and AuthJS...');
            execSync('pnpm install prisma', { cwd : projectPath, stdio: 'inherit' });
            execSync('pnpm prisma init --datasource-provider sqlite', { cwd: projectPath, stdio: 'inherit' });
            const prismaConfigFile = path.join(projectPath, 'prisma', 'schema.prisma');
            const prismaConfigContent = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

datasource db {
  provider = "postgresql"
  url  	    = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}
generator client {
  provider = "prisma-client-js"
}
 
model User {
  id            String          @id @default(cuid())
  name          String?
  email         String          @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  Authenticator Authenticator[]
 
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
 
model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
 
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
 
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
 
  @@id([provider, providerAccountId])
}
 
model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
 
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
 
model VerificationToken {
  identifier String
  token      String
  expires    DateTime
 
  @@id([identifier, token])
}
 
model Authenticator {
  credentialID         String  @unique
  userId               String
  providerAccountId    String
  credentialPublicKey  String
  counter              Int
  credentialDeviceType String
  credentialBackedUp   Boolean
  transports           String?
 
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
 
  @@id([userId, credentialID])
}`;
            fs.writeFileSync(prismaConfigFile, prismaConfigContent);
            execSync('pnpm prisma generate', { cwd: projectPath, stdio: 'inherit' });
            const serverDirPath = path.join(projectPath, 'src', 'lib', 'server');
            if (!fs.existsSync(serverDirPath)) {
                fs.mkdirSync(serverDirPath, { recursive: true });
            }
            const prismaTsConf = path.join(projectPath, 'src', 'lib', 'server', 'prisma.ts');
            const prismaTsContent = "import { PrismaClient } from '@prisma/client';\nconst prisma = new PrismaClient();\n\nexport { prisma };";
            fs.writeFileSync(prismaTsConf, prismaTsContent);

            execSync('pnpm add @auth/sveltekit', { cwd: projectPath, stdio: 'inherit' });
            const authConfigFile = path.join(projectPath, 'src', 'auth.ts');
            const authConfigContent = `import { SvelteKitAuth } from "@auth/sveltekit"
import Google from "@auth/sveltekit/providers/google"
import Github from "@auth/sveltekit/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "$lib/server/prisma"
 
export const { handle, signIn, signOut } = SvelteKitAuth({
    adapter: PrismaAdapter(prisma),
    providers: [Google, Github],
})`;
            fs.writeFileSync(authConfigFile, authConfigContent);
            execSync('pnpm add @auth/core', { cwd: projectPath, stdio: 'inherit' });
            execSync('pnpm add @prisma/client @auth/prisma-adapter', { cwd: projectPath, stdio: 'inherit' });
            execSync('pnpm add prisma --save-dev', { cwd: projectPath, stdio: 'inherit' });
            const authServerTsConf = path.join(projectPath, 'src', 'hooks.server.ts');
            const authServerTsContent = "export { handle } from './auth'";
            fs.writeFileSync(envPath, '');
            fs.writeFileSync(authServerTsConf, authServerTsContent);
            const envContentPrisma = "DATABASE_URL='YOUR_DATABASE_URL'\nDATABASE_URL_UNPOOLED='YOUR_DATABASE_URL_UNPOOLE'\n\nAUTH_SECRET='YOUR_AUTH_SECRET'\n\nAUTH_GOOGLE_ID='YOUR_GOOGLE_ID'\nAUTH_GOOGLE_SECRET='YOUR_GOOGLE_SECRET'\n\nAUTH_GITHUB_ID='YOUR_GITHUB_ID'\nAUTH_GITHUB_SECRET='YOUR_GITHUB_SECRET'\n\n";
            fs.appendFileSync(envPath, envContentPrisma);
            console.log('\n');
        }

        // Init Stripe

        if (useStripe === true) {
            console.log('Installing Stripe...');
            execSync('pnpm install -D stripe @stripe/stripe-js svelte-stripe', { cwd: projectPath, stdio: 'inherit' });
            const envContentStripe = "STRIPE_SECRET_KEY='YOUR_STRIPE_SECRET_KEY'"
            fs.appendFileSync(envPath, envContentStripe);
        }

        // Init +page.svelte

        const pageSvelte = path.join(projectPath, 'src', 'routes', '+page.svelte');
        const pageSvelteContent = `<div class="flex flex-col justify-between items-center bg-[#FAF9F6] h-screen w-screen">
    <div class="relative w-screen mt-[4%]">
        <p class="absolute left-[5%] border-[#bab8b8] bg-white py-2 border px-4 text-lg w-[17%]">Get started by setup the <span class="font-bold">.env</span> and edit <span class="font-bold">+page.svelte</span></p>
        <p class="absolute right-[5%] border-[#bab8b8] bg-white py-2 border px-4 text-lg">By <span class="font-bold">Louis Truptil</span></p>
    </div>
    <div class="w-screen flex items-center justify-center">
        <img class="bg-[#FAF9F6]" src="https://github.com/louistruptil/LTPL-stack/blob/main/LTPL_logo_black.png?raw=true" alt="logo">
    </div>
    <a href="" class="flex flex-col items-center mb-[4%] border-[#bab8b8] bg-white py-2 border px-4">
        <p class="font-bold mb-4 text-3xl">Docs ⮕</p>
        <p class="w-[50%] text-[#787878]">Find all information you need about LTPL Stack</p>
    </a>
</div>`;
        fs.writeFileSync(pageSvelte, pageSvelteContent);
        
        console.log('Installing dependencies...');
        execSync('pnpm install', { cwd: projectPath, stdio: 'inherit' });
        
        console.log(`Project created at ${projectPath}`);
        console.log('To get started:');
        console.log(`cd ${projectName}`);
        console.log('pnpm run dev');
    } catch (err) {
        console.error(err);
    }
}

createProject();