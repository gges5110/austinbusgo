import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:5001/graphql",
  documents: ["src/schemas/*.tsx"],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    "src/interfaces/interface.d.tsx": { plugins: ["typescript"] },
    "src/interfaces": {
      preset: "near-operation-file",
      presetConfig: {
        extension: ".generated.ts",
        baseTypesPath: "interface.d.tsx",
      },
      config: {
        exposeQueryKeys: true,
        exposeFetcher: true,
        fetcher: {
          endpoint: "graphQLEndpoint",
          fetchParams: {
            headers: {
              "Content-Type": "application/json",
            },
          },
        },
        namingConvention: {
          typeNames: "pascal-case#pascalCase",
          enumValues: "keep",
        },
      },
      plugins: [
        "typescript-operations",
        "typescript-react-query",
        {
          add: {
            content: "import { graphQLEndpoint } from 'config/config';",
          },
        },
      ],
    },
  },
  hooks: {
    afterAllFileWrite: ["prettier --write"],
  },
};

export default config;
