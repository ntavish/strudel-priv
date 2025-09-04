import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const corePackageDir = resolve(projectDir, 'packages', 'core')

const { docs } = JSON.parse(await readFile(resolve(projectDir, 'doc.json'), 'utf8'));

const coreDocs = docs.filter(doc => doc.meta?.path?.startsWith(corePackageDir) ?? false)

var dts = ''

for (const doc of coreDocs) {
    for (const name of [doc.name, ...doc.synonyms ?? []]) {
        dts += doc.comment + '\n'
        dts += 'function ' + name + '(' + (doc.params?.map(p=>p.name).join(',') ?? '') + '): Pattern\n\n'
    }
}

dts += 'interface Pattern {\n\t'

for (const doc of coreDocs) {
    for (const name of [doc.name, ...doc.synonyms ?? []]) {
        dts += (doc.comment + '\n').replaceAll('\n', '\n\t')
        dts += name + '(' + (doc.params?.map(p=>p.name).join(',') ?? '') + '): Pattern\n\n\t'
    }
}

dts += '\n}'

await writeFile(resolve(projectDir, 'strudel-core.d.ts'), dts)
