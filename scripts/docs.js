const fs = require('fs')
const path = require('path')
const files = require('./docs.json')
const yaml = require('js-yaml')

const sanitizeMDX = str =>
  str.replace('{', '\\{').replace('}', '\\}').replace('!', '\\!')

const linkifyRef = str => {
  const [, objectName] = str.split('!')
  const [object, type] = objectName.split(':')
  const [parent, name] = object.split('#')
  return `[${name ?? parent}](/docs/reference/js#${
    name != null ? parent + '.' : ''
  }${type}_${name ?? parent})`
}

const jsConstructorTemplate = property =>
  `\`\`\`typescript
${property.syntax.content}
\`\`\`
${property.summary != null ? `> ${property.summary}` : ''}
`

const jsPropertyTemplate = (property, declarations) =>
  `- #### ++dnt++${declarations.name}.${property.name.split('(')[0]}

\`\`\`typescript
${property.syntax.content}
\`\`\`
`

const jsMethodTemplate = (docItem, declarations) =>
  `- #### ++dnt++${declarations.name}.${docItem.name.split('(')[0]}
  - Parameters:
${docItem.syntax.parameters
  ?.map(
    parameter =>
      `    - \`${parameter?.id ?? ''}\`: \`${parameter?.type}\` ${
        parameter?.description
      }
`
  )
  .join('')}
  - Returns:
++dnt++\`${docItem.syntax.return.type}\`

${docItem.syntax.return.description}
${
  docItem.syntax != null
    ? `
\`\`\`typescript
${sanitizeMDX(docItem.syntax.content)}
\`\`\`
`
    : ''
}
`

const jsClassTemplate = declarations => `
## class ++dnt++${declarations.name}

${
  declarations.syntax != null
    ? `\`\`\`typescript
${declarations.syntax}
\`\`\`
`
    : ''
}

${declarations.constructors
  ?.map(member => jsConstructorTemplate(member, files))
  ?.join('')}

### Properties - ++dnt++${declarations.name}:
${declarations.properties
  ?.map(member => jsPropertyTemplate(member, declarations))
  .join('')}

### Methods - ++dnt++${declarations.name}:
${declarations.methods
  ?.map(member => jsMethodTemplate(member, declarations))
  .join('')}
`

const jsPackageTemplate = declarations => `
## ${declarations.name}


### Install

\`\`\`bash
pnpm add ${declarations.name}
\`\`\`

### Init

\`\`\`js init.js
// from ../../code-examples/initOrganigram.ts
\`\`\`

### Classes

${declarations.classes.map(_class => `- ${linkifyRef(_class)}`).join('\n')}

### Interfaces

${declarations.interfaces
  .map(_interface => `- ${linkifyRef(_interface)}`)
  .join('\n')}

### Types 

${declarations.typeAliases.map(_type => `- ${linkifyRef(_type)}`).join('\n')}

### Enums

${declarations.enums.map(_enum => `- ${linkifyRef(_enum)}`).join('\n')}
`

const jsInterfaceTemplate = declarations => `
## interface ${declarations.name}

${declarations.properties
  ?.map(member => jsPropertyTemplate(member, declarations))
  .join('')}
`

const jsTypeTemplate = declarations => `
## type ++dnt++${declarations.name}

\`${declarations.syntax}\`
`

const jsEnumTemplate = declarations => `
## enum ++dnt++${declarations.name}

${declarations.fields
  .map(field => `- ${field.name}: ${field.value}`)
  .join('\n')}
`

const jsTemplate = declarations => {
  let template
  switch (declarations.uid?.split(':')?.[1]) {
    case 'class':
      template = jsClassTemplate(declarations)
      break
    case 'interface':
      template = jsInterfaceTemplate(declarations)
      break
    case 'type':
      template = jsTypeTemplate(declarations)
      break
    case 'enum':
      template = jsEnumTemplate(declarations)
      break
    default:
      template =
        declarations.type === 'package'
          ? jsPackageTemplate(declarations)
          : `## ${declarations.name} (${
              declarations.uid?.split(':')?.[1] ?? ''
            })
    `
      break
  }
  return sanitizeMDX(template)
}

const markdown = async ({ files }) => {
  return await new Promise((resolve, reject) => {
    // write to dest stream
    let writeStream
    try {
      writeStream = fs.createWriteStream(
        '../../stack/assets/docs/reference/js.mdx',
        { flags: 'w' }
      )
    } catch (err) {
      reject(err)
    }
    writeStream.on('error', err => {
      reject(err)
    })
    writeStream.on('finish', () => {
      resolve()
    })
    writeStream.write(`export const metadata = { title: "⚙️ Typescript", order: 6.2 }

#  Typescript reference ⚙️

The official Javascript/Typescript documentation for the contracts and types used in the ${process.env.NEXT_PUBLIC_COMPANY_URL} stack.

`)
    if (files != null) {
      files
        .sort(file => (file.uid?.split(':')?.[1] === 'enum' ? -1 : 1))
        .sort(file => (file.uid?.split(':')?.[1] === 'type' ? -1 : 1))
        .sort(file => (file.uid?.split(':')?.[1] === 'interface' ? -1 : 1))
        .sort(file => (file.uid?.split(':')?.[1] === 'class' ? -1 : 1))
        .sort(file => (file.name === 'Organ' ? -1 : 1))
        .sort(file => (file.name === 'Organigram' ? -1 : 1))
        .sort(file => (file.name === '@organigram/js' ? -1 : 1))
        .forEach(file => {
          writeStream.write(jsTemplate(file))
        })
    }

    writeStream.end()
  })
}

const walkPath = dir => {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(function (file) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat?.isDirectory()) {
      results = results.concat(walkPath(filePath))
    } else {
      results.push(filePath)
    }
  })

  return results
}

function build() {
  // If typescript:

  // With API Extractor:
  // const data = compile({ contracts: contracts })
  // const md = markdown({ json: out })

  // With API Documenter (md):
  // const filesPaths = walkPath('./packages/js/markdown')
  // const files = filesPaths.map(filePath => fs.readFileSync(filePath, 'utf8'))
  // const concat = files.reduce((acc, file) => {
  //   return acc + file
  // }, '')
  // const md = markdown({ files })
  // const saved = fs.writeFileSync(
  //   './stack/assets/docs/reference/js.mdx',
  //   concat,
  //   'utf8'
  // )

  // With API Documenter (yaml):
  const filesPaths = walkPath('./yaml')
  const files = filesPaths
    .map(filePath => yaml.load(fs.readFileSync(filePath, 'utf8')))
    .slice(0, -1)
  fs.writeFileSync('./scripts/docs.json', JSON.stringify(files), 'utf8')
  markdown({ files })
  console.info('done!')
}

build()
